import { getAcademySettings } from "@/lib/academy-settings";
import { connectDB } from "@/lib/db";
import { sendAbsenceAlertEmail, sendChallanGeneratedEmail, sendEmail, sendPaymentStatusEmail } from "@/lib/email";
import { FeeChallan } from "@/models/FeeChallan";
import { PortalNotification } from "@/models/PortalNotification";
import { Student } from "@/models/Student";
import { User } from "@/models/User";

export type NotificationType = "Absent" | "Result" | "Challan" | "PaymentVerified" | "PaymentRejected";

const templates: Record<NotificationType, (name: string, detail: string) => { subject: string; text: string }> = {
  Absent: (name, detail) => ({ subject: "Attendance update", text: `${name} was marked absent on ${detail}.` }),
  Result: (name, detail) => ({ subject: "New result published", text: `A new result for ${name} is available: ${detail}.` }),
  Challan: (name, detail) => ({ subject: "New fee challan", text: `A new fee challan for ${name} was generated: ${detail}.` }),
  PaymentVerified: (name, detail) => ({ subject: "Fee payment verified", text: `The payment for ${name} was verified: ${detail}.` }),
  PaymentRejected: (name, detail) => ({ subject: "Fee payment needs attention", text: `The payment for ${name} was rejected: ${detail}. Please contact the academy if you need help.` }),
};

export async function notify(input: { studentId: string; type: NotificationType; key: string; detail: string }) {
  try {
    await connectDB();
    const student = await Student.findById(input.studentId).select("fullName guardian").lean();
    if (!student?.guardian) return;
    const parent = await User.findById(student.guardian).select("name email").lean();
    if (!parent?.email) return;
    try {
      await PortalNotification.create({ key: input.key, student: student._id, type: input.type });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === 11000) return;
      throw error;
    }
    const message = templates[input.type](student.fullName, input.detail);
    try {
      const academy = await getAcademySettings();
      if (input.type === "Absent") {
        await sendAbsenceAlertEmail({ to: parent.email, parentName: parent.name || "Parent", studentName: student.fullName, date: input.detail });
      } else if (input.type === "Challan") {
        const challan = await FeeChallan.findOne({ challanNo: input.detail }).select("pendingAmount total").lean();
        await sendChallanGeneratedEmail({
          to: parent.email,
          parentName: parent.name || "Parent",
          studentName: student.fullName,
          challanNo: input.detail,
          amountPkr: challan?.pendingAmount ?? challan?.total ?? 0,
        });
      } else if (input.type === "PaymentVerified" || input.type === "PaymentRejected") {
        await sendPaymentStatusEmail({
          to: parent.email,
          parentName: parent.name || "Parent",
          studentName: student.fullName,
          status: input.type === "PaymentVerified" ? "Verified" : "Rejected",
          detail: input.detail,
        });
      } else {
        await sendEmail({ to: parent.email, subject: `${message.subject} — ${academy.name}`, html: "", text: `Hello ${parent.name || "Parent"},\n\n${message.text}\n\n${academy.name}` });
      }
    } catch (error) {
      console.error(`Unable to send ${input.type} notification:`, error);
    }
  } catch (error) {
    console.error(`Unable to create ${input.type} notification:`, error);
  }
}
