// 1회성 마이그레이션 도구 — Issue #148. User 소프트 삭제 컨벤션을 Product와
// 동일한 deletedAt(Date|null)로 통일한다. 기존 문서는 isDelete(boolean)만
// 갖고 있으므로 deletedAt을 백필한다. 원래 삭제 시점 기록이 없어
// isDelete: true였던 문서는 실행 시각을 deletedAt으로 채운다(복원 불가한 정보
// 손실 — PR 본문에 명시).
//
// 실행 후에도 isDelete 필드는 즉시 지우지 않는다(롤백 여지). 검증 끝난 뒤
// unset-legacy 모드로 별도 실행한다. 이 스크립트 자체도 머지 후 1회 실행하고
// 레포에서 제거할 예정이다(재사용 목적 아님) — src/db/connect.ts를 import하지
// 않고 연결 로직을 여기 직접 복제한 것도 그 때문이다.
//
// 사용법:
//   node scripts/migrations/unify-user-soft-delete.mjs count
//   node scripts/migrations/unify-user-soft-delete.mjs run
//   node scripts/migrations/unify-user-soft-delete.mjs verify
//   node scripts/migrations/unify-user-soft-delete.mjs unset-legacy

import mongoose from "mongoose";

const resolveUri = () => {
  const testUri = process.env.MONGO_TEST_URI;
  if (testUri) return testUri;

  if (!process.env.DB_USER || !process.env.DB_PASSWORD) {
    throw new Error(
      "MongoDB 연결 정보(DB_USER/DB_PASSWORD 또는 MONGO_TEST_URI)가 없습니다.",
    );
  }

  return `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@new-invitation-cluster.8umdvcl.mongodb.net/new_invitation?retryWrites=true&w=majority&appName=new-invitation-cluster`;
};

const mode = process.argv[2];
const VALID_MODES = ["count", "run", "verify", "unset-legacy"];

if (!VALID_MODES.includes(mode)) {
  console.error(`사용법: node ${process.argv[1]} <${VALID_MODES.join("|")}>`);
  process.exit(1);
}

const main = async () => {
  await mongoose.connect(resolveUri(), { bufferCommands: false });
  const users = mongoose.connection.collection("users");

  try {
    if (mode === "count") {
      const [trueCount, falseCount, missingCount] = await Promise.all([
        users.countDocuments({ isDelete: true }),
        users.countDocuments({ isDelete: false }),
        users.countDocuments({ isDelete: { $exists: false } }),
      ]);
      console.log(`isDelete: true  → ${trueCount}건 (deletedAt = 실행 시각으로 백필 예정)`);
      console.log(`isDelete: false → ${falseCount}건 (deletedAt = null로 백필 예정)`);
      console.log(`isDelete 필드 없음 → ${missingCount}건`);
      return;
    }

    if (mode === "run") {
      const executedAt = new Date();
      const deletedResult = await users.updateMany(
        { isDelete: true },
        { $set: { deletedAt: executedAt } },
      );
      const activeResult = await users.updateMany(
        { isDelete: false },
        { $set: { deletedAt: null } },
      );
      console.log(`실행 시각: ${executedAt.toISOString()}`);
      console.log(`isDelete: true  → deletedAt 백필: matched ${deletedResult.matchedCount}, modified ${deletedResult.modifiedCount}`);
      console.log(`isDelete: false → deletedAt 백필: matched ${activeResult.matchedCount}, modified ${activeResult.modifiedCount}`);
      console.log("isDelete 필드는 그대로 남겨뒀다 — 검증 후 unset-legacy 모드로 별도 실행.");
      return;
    }

    if (mode === "verify") {
      const [trueButNull, falseButNotNull, missingDeletedAt] = await Promise.all([
        users.countDocuments({ isDelete: true, deletedAt: null }),
        users.countDocuments({ isDelete: false, deletedAt: { $ne: null } }),
        users.countDocuments({ deletedAt: { $exists: false } }),
      ]);
      console.log(`isDelete: true인데 deletedAt이 null인 문서(기대: 0) → ${trueButNull}`);
      console.log(`isDelete: false인데 deletedAt이 non-null인 문서(기대: 0) → ${falseButNotNull}`);
      console.log(`deletedAt 필드가 아직 없는 문서(기대: 0) → ${missingDeletedAt}`);
      if (trueButNull === 0 && falseButNotNull === 0 && missingDeletedAt === 0) {
        console.log("검증 통과.");
      } else {
        console.error("검증 실패 — 위 불일치를 확인하세요.");
        process.exitCode = 1;
      }
      return;
    }

    if (mode === "unset-legacy") {
      const result = await users.updateMany({}, { $unset: { isDelete: "" } });
      console.log(`isDelete 필드 제거: matched ${result.matchedCount}, modified ${result.modifiedCount}`);
      return;
    }
  } finally {
    await mongoose.disconnect();
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
