from __future__ import annotations

from datetime import timedelta

from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session as OrmSession

from app.core.config import Settings, get_settings
from app.core.security import hash_password
from app.db.models import (
    AccountStatus,
    ContentStatus,
    LinkStatus,
    MoodCheckInConfig,
    RiskStateLabel,
    Scenario,
    ScenarioAttempt,
    ScenarioChoice,
    ScenarioSignal,
    SelfCheckAttempt,
    SelfCheckAttemptAnswer,
    SelfCheckChoice,
    SelfCheckQuestion,
    SelfCheckTest,
    SelfCheckThreshold,
    SosAlert,
    SosSource,
    StudentAdultLink,
    User,
    UserRole,
    utc_now,
)
from app.db.session import SessionLocal
from app.services.links import create_link
from app.services.mood_checkins import CONTEXT_TAG_OPTIONS, MOOD_OPTIONS
from app.services.self_checks import submit_self_check_attempt
from app.services.sos import create_sos_alert
from app.schemas.sos import SosAlertCreate

DEMO_PASSWORD = "BeYouDemo!2026"
DEMO_STUDENT_EMAIL = "student.demo@beyou.local"
DEMO_TEACHER_EMAIL = "teacher.demo@beyou.local"
DEMO_PARENT_EMAIL = "parent.demo@beyou.local"
DEMO_ADMIN_EMAIL = "admin.demo@beyou.local"


def _upsert_demo_user(
    db: OrmSession,
    *,
    email: str,
    role: str,
    full_name: str,
    school: str | None = None,
    class_name: str | None = None,
) -> User:
    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        user = User(email=email, password_hash=hash_password(DEMO_PASSWORD), role=role, full_name=full_name)
        db.add(user)
    user.password_hash = hash_password(DEMO_PASSWORD)
    user.role = role
    user.status = AccountStatus.ACTIVE.value
    user.full_name = full_name
    user.school = school
    user.class_name = class_name
    user.is_demo = True
    db.commit()
    db.refresh(user)
    return user


def _ensure_active_demo_link(db: OrmSession, *, admin: User, student: User, adult: User, relationship_type: str) -> None:
    existing = db.scalar(
        select(StudentAdultLink).where(
            StudentAdultLink.student_id == student.id,
            StudentAdultLink.adult_id == adult.id,
            StudentAdultLink.relationship_type == relationship_type,
            StudentAdultLink.status == LinkStatus.ACTIVE.value,
        )
    )
    if existing is None:
        create_link(db, actor=admin, student_id=student.id, adult_id=adult.id, relationship_type=relationship_type)


SELF_CHECK_SEEDS = [
    {
        "title": "Sức khỏe cảm xúc",
        "description": "Bài tự kiểm tra ngắn giúp em lắng nghe cảm xúc hiện tại. Kết quả không phải chẩn đoán.",
        "questions": [
            (
                "Trong vài ngày gần đây, em cảm thấy tâm trạng của mình thế nào?",
                [("Khá ổn và dễ chịu", 0), ("Có lúc lên xuống", 1), ("Thường nặng nề", 2)],
            ),
            (
                "Khi gặp chuyện khó, em có thấy mình có người để chia sẻ không?",
                [("Có, em biết mình có thể nói với ai", 0), ("Chưa chắc lắm", 1), ("Em thấy khá một mình", 2)],
            ),
        ],
    },
    {
        "title": "Áp lực bạn bè",
        "description": "Bài ngắn giúp em nhận ra áp lực từ bạn bè và chọn cách giữ ranh giới an toàn.",
        "questions": [
            (
                "Khi bạn rủ làm điều em không thoải mái, em thường cảm thấy thế nào?",
                [("Em có thể từ chối bình tĩnh", 0), ("Em hơi ngại nói không", 1), ("Em thường làm theo dù không muốn", 2)],
            ),
            (
                "Sau các tình huống với nhóm bạn, em có còn thấy an toàn với lựa chọn của mình không?",
                [("Có, em thấy ổn", 0), ("Có lúc em phân vân", 1), ("Em thường lo lắng hoặc hối tiếc", 2)],
            ),
        ],
    },
]


THRESHOLD_COPY = [
    (
        RiskStateLabel.STABLE.value,
        0,
        0,
        "Em đang có nhiều dấu hiệu ổn định.",
        "Tiếp tục giữ những thói quen giúp em thấy an toàn và thoải mái.",
        "Việc em dành thời gian lắng nghe bản thân là một điều tích cực.",
        "Tiếp tục giữ thói quen giúp em thấy an toàn và thoải mái.",
    ),
    (
        RiskStateLabel.ATTENTION.value,
        1,
        2,
        "Có một vài dấu hiệu em nên để ý thêm.",
        "Chọn một việc nhỏ giúp em nghỉ ngơi, bình tĩnh hoặc chia sẻ nhẹ nhàng.",
        "Nhận ra cảm xúc của mình là bước đầu rất đáng quý.",
        "Thử một tình huống luyện kỹ năng hoặc chia sẻ với người em tin tưởng.",
    ),
    (
        RiskStateLabel.SUPPORT.value,
        3,
        3,
        "Em không cần tự xử lý mọi thứ một mình.",
        "Hãy cân nhắc nói chuyện với giáo viên, phụ huynh hoặc một người lớn tin cậy.",
        "Tìm kiếm hỗ trợ là một cách chăm sóc bản thân, không phải lỗi của em.",
        "Hãy cân nhắc nói chuyện với giáo viên, phụ huynh hoặc một người lớn tin cậy.",
    ),
    (
        RiskStateLabel.EARLY_SUPPORT.value,
        4,
        4,
        "Điều em đang trải qua đáng được hỗ trợ sớm.",
        "Ưu tiên ở gần nơi an toàn và nói với một người lớn em tin tưởng.",
        "Em xứng đáng được lắng nghe và hỗ trợ kịp thời.",
        "Hãy tìm một người lớn tin cậy ở gần em. BeYou sẽ có nút SOS ở bước tiếp theo của sản phẩm.",
    ),
]


SCENARIO_SEEDS = [
    {
        "title": "Rủ rê sau giờ học",
        "situation": "Một nhóm bạn rủ rê em bỏ tiết phụ đạo để đi chơi dù em không thấy thoải mái.",
        "skill_tag": "Từ chối an toàn",
        "recommended_response": "Em có thể nói: 'Mình không đi được, mình cần vào lớp. Hẹn các bạn lúc khác nhé.'",
        "lesson": "Từ chối rõ ràng và bình tĩnh giúp em giữ ranh giới mà không làm tình huống căng hơn.",
        "choices": [
            (
                "Nói rõ là em không tham gia và đề nghị gặp lại sau.",
                ScenarioSignal.CONSTRUCTIVE.value,
                "Lựa chọn này có điểm tích cực vì em giữ ranh giới rõ ràng và vẫn tôn trọng bạn bè.",
            ),
            (
                "Đi theo nhóm dù trong lòng không muốn.",
                ScenarioSignal.RISKY.value,
                "Lựa chọn này có thể khiến tình huống khó hơn vì em bỏ qua cảm giác không an toàn của mình.",
            ),
        ],
    },
    {
        "title": "Bị trêu chọc online",
        "situation": "Một bạn đăng bình luận online trêu chọc ngoại hình của em và nhiều người bấm thích.",
        "skill_tag": "Giữ an toàn trên mạng",
        "recommended_response": "Em có thể lưu bằng chứng, không đáp trả nóng vội và báo với người lớn tin cậy.",
        "lesson": "Dừng lại trước khi phản ứng giúp em bảo vệ mình và có thêm hỗ trợ phù hợp.",
        "choices": [
            (
                "Chụp lại bình luận, rời khỏi cuộc trò chuyện và nhờ người lớn hỗ trợ.",
                ScenarioSignal.CONSTRUCTIVE.value,
                "Lựa chọn này có điểm tích cực vì em ưu tiên an toàn và không phải đối mặt một mình.",
            ),
            (
                "Đăng lại lời trêu chọc để mọi người bênh mình.",
                ScenarioSignal.RISKY.value,
                "Lựa chọn này có thể khiến tình huống khó hơn vì cuộc tranh cãi online dễ lan rộng.",
            ),
        ],
    },
    {
        "title": "Mâu thuẫn với bạn thân",
        "situation": "Bạn thân giận em vì hiểu lầm một tin nhắn trong nhóm lớp.",
        "skill_tag": "Giao tiếp bình tĩnh",
        "recommended_response": "Em có thể hẹn nói chuyện riêng, dùng câu 'mình cảm thấy...' và lắng nghe bạn.",
        "lesson": "Nói chuyện riêng và bình tĩnh giúp hai bên hiểu nhau hơn thay vì làm lớn chuyện.",
        "choices": [
            (
                "Nhắn bạn để hẹn nói chuyện riêng khi cả hai bình tĩnh.",
                ScenarioSignal.CONSTRUCTIVE.value,
                "Lựa chọn này có điểm tích cực vì em tạo cơ hội giải thích mà không gây áp lực trước nhóm.",
            ),
            (
                "Kể chuyện này lên nhóm lớp để mọi người phân xử.",
                ScenarioSignal.RISKY.value,
                "Lựa chọn này có thể khiến tình huống khó hơn vì bạn có thể thấy bị làm tổn thương thêm.",
            ),
        ],
    },
    {
        "title": "Áp lực điểm số",
        "situation": "Sau một bài kiểm tra không như mong muốn, em lo rằng mình làm bố mẹ và thầy cô thất vọng.",
        "skill_tag": "Quản lý áp lực học tập",
        "recommended_response": "Em có thể xem lại phần chưa hiểu, chọn một bước ôn tập nhỏ và nói với người lớn về điều em cần.",
        "lesson": "Một điểm số không định nghĩa con người em; chia nhỏ việc học giúp áp lực dễ xử lý hơn.",
        "choices": [
            (
                "Chọn một phần cần ôn lại và nhờ thầy cô hoặc bạn giải thích.",
                ScenarioSignal.CONSTRUCTIVE.value,
                "Lựa chọn này có điểm tích cực vì em biến áp lực thành một bước học cụ thể.",
            ),
            (
                "Giấu bài kiểm tra và tự trách mình cả ngày.",
                ScenarioSignal.RISKY.value,
                "Lựa chọn này có thể khiến tình huống khó hơn vì em phải giữ lo lắng một mình.",
            ),
        ],
    },
]


def _upsert_self_check_content(db: OrmSession, seed: dict) -> SelfCheckTest:
    test = db.scalar(select(SelfCheckTest).where(SelfCheckTest.title == seed["title"], SelfCheckTest.is_demo.is_(True)))
    if test is None:
        test = SelfCheckTest(title=seed["title"], is_demo=True)
        db.add(test)
        db.flush()
    test.description = seed["description"]
    test.status = ContentStatus.PUBLISHED.value
    test.is_active = True
    test.is_demo = True
    db.execute(
        update(SelfCheckAttemptAnswer)
        .where(
            SelfCheckAttemptAnswer.attempt_id.in_(
                select(SelfCheckAttempt.id).where(SelfCheckAttempt.test_id == test.id)
            )
        )
        .values(question_id=None, choice_id=None)
    )
    db.execute(delete(SelfCheckThreshold).where(SelfCheckThreshold.test_id == test.id))
    db.execute(
        delete(SelfCheckChoice).where(
            SelfCheckChoice.question_id.in_(
                select(SelfCheckQuestion.id).where(SelfCheckQuestion.test_id == test.id)
            )
        )
    )
    db.execute(delete(SelfCheckQuestion).where(SelfCheckQuestion.test_id == test.id))
    db.flush()
    for question_order, (question_text, choices) in enumerate(seed["questions"], start=1):
        question = SelfCheckQuestion(test_id=test.id, text=question_text, sort_order=question_order, is_demo=True)
        db.add(question)
        db.flush()
        for choice_order, (choice_text, score_value) in enumerate(choices, start=1):
            db.add(
                SelfCheckChoice(
                    question_id=question.id,
                    text=choice_text,
                    score_value=score_value,
                    sort_order=choice_order,
                    is_demo=True,
                )
            )
    for label, min_score, max_score, comment, advice, positive_content, next_action in THRESHOLD_COPY:
        db.add(
            SelfCheckThreshold(
                test_id=test.id,
                state_label=label,
                min_score=min_score,
                max_score=max_score,
                comment=comment,
                advice=advice,
                positive_content=positive_content,
                suggested_next_action=next_action,
                is_demo=True,
            )
        )
    db.commit()
    db.refresh(test)
    return test


def _upsert_scenario_content(db: OrmSession, seed: dict) -> Scenario:
    scenario = db.scalar(select(Scenario).where(Scenario.title == seed["title"], Scenario.is_demo.is_(True)))
    if scenario is None:
        scenario = Scenario(
            title=seed["title"],
            situation=seed["situation"],
            skill_tag=seed["skill_tag"],
            recommended_response=seed["recommended_response"],
            lesson=seed["lesson"],
            is_demo=True,
        )
        db.add(scenario)
        db.flush()
    scenario.situation = seed["situation"]
    scenario.skill_tag = seed["skill_tag"]
    scenario.recommended_response = seed["recommended_response"]
    scenario.lesson = seed["lesson"]
    scenario.status = ContentStatus.PUBLISHED.value
    scenario.is_demo = True
    db.execute(update(ScenarioAttempt).where(ScenarioAttempt.scenario_id == scenario.id).values(selected_choice_id=None))
    db.execute(delete(ScenarioChoice).where(ScenarioChoice.scenario_id == scenario.id))
    db.flush()
    for choice_order, (text, signal, feedback) in enumerate(seed["choices"], start=1):
        db.add(
            ScenarioChoice(
                scenario_id=scenario.id,
                text=text,
                signal=signal,
                feedback=feedback,
                sort_order=choice_order,
                is_demo=True,
            )
        )
    db.commit()
    db.refresh(scenario)
    return scenario


def _upsert_mood_checkin_config(db: OrmSession) -> MoodCheckInConfig:
    config = db.scalar(select(MoodCheckInConfig).where(MoodCheckInConfig.name == "Demo supportive check-in"))
    if config is None:
        config = MoodCheckInConfig(name="Demo supportive check-in")
        db.add(config)
    config.status = ContentStatus.PUBLISHED.value
    config.student_prompt = "Dành một phút gọi tên cảm xúc hiện tại để chọn một bước chăm sóc nhỏ."
    config.adult_guidance = "Nếu học sinh chọn chia sẻ, bắt đầu bằng lắng nghe và hỏi em muốn được hỗ trợ thế nào."
    config.mood_options = [option.model_dump() for option in MOOD_OPTIONS]
    config.context_tags = [tag.model_dump() for tag in CONTEXT_TAG_OPTIONS]
    config.sort_order = 0
    config.updated_by_id = None
    config.is_demo = True
    db.commit()
    db.refresh(config)
    return config


def _choice_answers_for_score(test: SelfCheckTest, target_score: int) -> list[dict]:
    questions = sorted(test.questions, key=lambda question: question.sort_order)
    answers = []
    remaining = target_score
    for index, question in enumerate(questions):
        choices = sorted(question.choices, key=lambda choice: choice.score_value, reverse=True)
        selected = choices[-1]
        for choice in choices:
            if choice.score_value <= remaining or index == len(questions) - 1:
                selected = choice
                break
        remaining -= selected.score_value
        answers.append({"question_id": question.id, "choice_id": selected.id})
    return answers


def _seed_self_check_attempts(db: OrmSession, *, student: User, tests: list[SelfCheckTest]) -> None:
    db.execute(
        delete(SelfCheckAttemptAnswer).where(
            SelfCheckAttemptAnswer.attempt_id.in_(
                select(SelfCheckAttempt.id).where(
                    SelfCheckAttempt.student_id == student.id,
                    SelfCheckAttempt.is_demo.is_(True),
                )
            )
        )
    )
    db.execute(
        delete(SelfCheckAttempt).where(
            SelfCheckAttempt.student_id == student.id,
            SelfCheckAttempt.is_demo.is_(True),
        )
    )
    db.commit()
    now = utc_now()
    for index, target_score in enumerate([0, 1, 2, 3, 4, 1]):
        test = tests[index % len(tests)]
        db.refresh(test, attribute_names=["questions", "thresholds"])
        for question in test.questions:
            db.refresh(question, attribute_names=["choices"])
        attempt = submit_self_check_attempt(db, student, test.id, _choice_answers_for_score(test, target_score))
        attempt.completed_at = now - timedelta(days=index * 4)
        attempt.is_demo = True
        db.commit()


def _seed_sos_workflow(db: OrmSession, *, student: User, settings: Settings) -> None:
    existing = db.scalar(
        select(SosAlert).where(
            SosAlert.student_id == student.id,
            SosAlert.source == SosSource.DEMO_SEED.value,
            SosAlert.is_demo.is_(True),
        )
    )
    if existing is not None:
        return
    create_sos_alert(
        db,
        student,
        SosAlertCreate(
            severity="support",
            source=SosSource.DEMO_SEED.value,
            note="Dữ liệu demo: em muốn người lớn biết em cần được hỏi thăm.",
        ),
        settings=settings,
    )


def seed_demo_data(db: OrmSession, settings: Settings) -> bool:
    if not settings.allow_demo_seed:
        return False

    student = _upsert_demo_user(
        db,
        email=DEMO_STUDENT_EMAIL,
        role=UserRole.STUDENT.value,
        full_name="Nguyễn An Demo",
        school="Trường THPT BeYou Demo",
        class_name="10A1",
    )
    teacher = _upsert_demo_user(
        db,
        email=DEMO_TEACHER_EMAIL,
        role=UserRole.TEACHER.value,
        full_name="Cô Bình Demo",
    )
    parent = _upsert_demo_user(
        db,
        email=DEMO_PARENT_EMAIL,
        role=UserRole.PARENT.value,
        full_name="Phụ huynh Chi Demo",
    )
    admin = _upsert_demo_user(
        db,
        email=DEMO_ADMIN_EMAIL,
        role=UserRole.ADMIN.value,
        full_name="Quản trị viên Demo",
    )
    _ensure_active_demo_link(db, admin=admin, student=student, adult=teacher, relationship_type=UserRole.TEACHER.value)
    _ensure_active_demo_link(db, admin=admin, student=student, adult=parent, relationship_type=UserRole.PARENT.value)
    tests = [_upsert_self_check_content(db, seed) for seed in SELF_CHECK_SEEDS]
    for seed in SCENARIO_SEEDS:
        _upsert_scenario_content(db, seed)
    _upsert_mood_checkin_config(db)
    _seed_self_check_attempts(db, student=student, tests=tests)
    _seed_sos_workflow(db, student=student, settings=settings)
    return True


def main() -> None:
    settings = get_settings()
    with SessionLocal() as db:
        if not seed_demo_data(db, settings):
            print("Demo seed is disabled for this environment.")
            return
    print("Demo seed completed.")


if __name__ == "__main__":
    main()
