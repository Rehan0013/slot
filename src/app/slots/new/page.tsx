import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { createSlot } from "@/app/actions/slots";
import SlotForm from "@/components/SlotForm";

export default async function Page() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return <SlotForm onSubmitAction={createSlot} />;
}
