import "server-only";

import { getAdminDb } from "./firebase.server";
import { FieldValue } from "firebase-admin/firestore";
import { createNotification } from "./notifications.server";

export async function checkAndAwardAchievements(userId: string) {
  try {
    const db = getAdminDb();
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return;

    const userData = userSnap.data()!;
    const achievements: string[] = userData.achievements ?? [];
    const newAchievements: string[] = [...achievements];

    // Check 1: first_post (if has at least 1 project)
    if (!achievements.includes("first_post")) {
      const projectsSnap = await db
        .collection("projects")
        .where("ownerId", "==", userId)
        .limit(1)
        .get();
      if (!projectsSnap.empty) {
        newAchievements.push("first_post");
        await createNotification(
          userId,
          "achievement",
          "Nova Conquista: Pioneiro! ⟐",
          'Você desbloqueou a conquista "Pioneiro" ao listar seu primeiro projeto!',
          "/profile"
        );
      }
    }

    // Load feedbacks approved
    const feedbacksSnap = await db
      .collection("feedbacks")
      .where("reviewerId", "==", userId)
      .where("status", "==", "approved")
      .get();
    
    const approvedCount = feedbacksSnap.size;

    // Check 2: great_critic (at least 5 approved feedbacks)
    if (!achievements.includes("great_critic") && approvedCount >= 5) {
      newAchievements.push("great_critic");
      await createNotification(
        userId,
        "achievement",
        "Nova Conquista: Crítico Construtivo! 💬",
        'Você desbloqueou a conquista "Crítico Construtivo" ao ter 5 avaliações aprovadas!',
        "/profile"
      );
    }

    // Check 3: bug_hunter (total bugs reported in approved feedbacks >= 5)
    if (!achievements.includes("bug_hunter")) {
      let bugCountTotal = 0;
      feedbacksSnap.forEach((doc) => {
        const data = doc.data();
        bugCountTotal += (data.bugCount ?? 0) as number;
      });
      if (bugCountTotal >= 5) {
        newAchievements.push("bug_hunter");
        await createNotification(
          userId,
          "achievement",
          "Nova Conquista: Caçador de Bugs! 🐛",
          'Você desbloqueou a conquista "Caçador de Bugs" ao reportar 5 ou mais bugs em avaliações aprovadas!',
          "/profile"
        );
      }
    }

    // Check 4: reputation_master (reputationScore >= 0.9 and approvedCount >= 5)
    if (!achievements.includes("reputation_master") && approvedCount >= 5) {
      const reputation = userData.reputationScore ?? 0;
      if (reputation >= 0.9) {
        newAchievements.push("reputation_master");
        await createNotification(
          userId,
          "achievement",
          "Nova Conquista: Mestre de Opinião! 👑",
          'Você desbloqueou a conquista "Mestre de Opinião" ao atingir mais de 90% de taxa de aprovação com pelo menos 5 avaliações!',
          "/profile"
        );
      }
    }

    // If new achievements were added, update user doc
    if (newAchievements.length > achievements.length) {
      await userRef.update({
        achievements: newAchievements,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("[checkAndAwardAchievements] Error:", error);
  }
}
