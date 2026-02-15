const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
const db = getFirestore();
const messaging = getMessaging();

/**
 * Notify user of a new friend request
 */
exports.notifyFriendRequest = onDocumentCreated("friend_requests/{requestId}", async (event) => {
    const request = event.data.data();
    const toUid = request.to;
    const fromName = request.fromName || "Quelqu'un";

    // Get recipient's FCM token
    const userDoc = await db.collection("users").doc(toUid).get();
    const userData = userDoc.data();
    const fcmToken = userData?.fcmToken;

    if (!fcmToken) {
        console.log(`No FCM token for user ${toUid}`);
        return;
    }

    const message = {
        notification: {
            title: "🦖 Nouvelle demande d'ami !",
            body: `${fromName} souhaite vous ajouter en ami sur Drinkosaur.`,
        },
        token: fcmToken,
        webpush: {
            fcmOptions: {
                link: "https://drinkosaur-5cebe.web.app/social"
            }
        }
    };

    try {
        await messaging.send(message);
        console.log(`Notification sent to ${toUid}`);
    } catch (error) {
        console.error("Error sending notification:", error);
    }
});

/**
 * Notify user when invited to a group
 */
exports.notifyGroupInvitation = onDocumentUpdated("groups/{groupId}", async (event) => {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    const oldInvites = beforeData.pendingInviteIds || [];
    const newInvites = afterData.pendingInviteIds || [];

    // Find newly added UIDs
    const addedUids = newInvites.filter(uid => !oldInvites.includes(uid));

    if (addedUids.length === 0) return;

    const groupName = afterData.name || "un groupe";

    for (const uid of addedUids) {
        const userDoc = await db.collection("users").doc(uid).get();
        const userData = userDoc.data();
        const fcmToken = userData?.fcmToken;

        if (fcmToken) {
            const message = {
                notification: {
                    title: "🍻 Invitation à un groupe",
                    body: `On vous invite à rejoindre le groupe "${groupName}" !`,
                },
                token: fcmToken,
                webpush: {
                    fcmOptions: {
                        link: "https://drinkosaur-5cebe.web.app/"
                    }
                }
            };

            try {
                await messaging.send(message);
                console.log(`Group invite notification sent to ${uid}`);
            } catch (error) {
                console.error(`Error sending group notification to ${uid}:`, error);
            }
        }
    }
});

/**
 * Notify when entering Top 10 Global
 */
exports.notifyGlobalRanking = onDocumentUpdated("live_status/{userId}", async (event) => {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    // Only trigger if BAC increased significantly or just hit a threshold
    if (afterData.currentBac > 0.5 && beforeData.currentBac <= 0.5) {
        // Example: logic to check if they are in top 10
        // (This query might be heavy, so we use it sparingly)
        const topUsers = await db.collection("live_status")
            .orderBy("currentBac", "desc")
            .limit(10)
            .get();

        const isTop10 = topUsers.docs.some(doc => doc.id === event.params.userId);

        if (isTop10) {
            const userDoc = await db.collection("users").doc(event.params.userId).get();
            const fcmToken = userDoc.data()?.fcmToken;

            if (fcmToken) {
                await messaging.send({
                    notification: {
                        title: "🏆 Classement Global",
                        body: "Félicitations ! Vous êtes dans le Top 10 mondial Drinkosaur ! 🔥",
                    },
                    token: fcmToken
                });
            }
        }
    }
});
