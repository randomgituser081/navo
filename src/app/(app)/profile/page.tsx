"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { auth, navo } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { mediaUrl } from "@/lib/media";
import { Badge, Button, Card, Field, Input, PageLoader, PasswordInput, Select } from "@/components/ui";
import { useToast } from "@/components/toast";

const STRONG = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const emptyAddress = { state: "", city: "", street: "", houseNo: "", closestLandmark: "" };

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const { data, loading, reload } = useApi("/profile");
  const user = data?.user;

  const [form, setForm] = useState({ phoneNumber: "", gender: "", ...emptyAddress });
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
  const [changing, setChanging] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      phoneNumber: user.phoneNumber ?? "",
      gender: user.gender ?? "",
      ...emptyAddress,
      ...(user.locationDetails ?? {}),
    });
  }, [user]);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { phoneNumber, gender, ...address } = form;
      const hasAddress = address.city.trim() && address.street.trim();
      await navo.patch("/profile/update-profile", {
        phoneNumber: phoneNumber.trim() || undefined,
        gender: gender || undefined,
        ...(hasAddress && { locationDetails: address }),
      });
      toast("Profile updated", "success");
      reload();
    } catch (err) {
      toast((err as Error).message, "danger");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    if (!STRONG.test(pw.newPassword)) return toast("New password needs 8+ characters with upper and lower case, a number and a symbol", "danger");
    if (pw.newPassword !== pw.confirmNewPassword) return toast("New passwords do not match", "danger");
    setChanging(true);
    try {
      await navo.put("/auth/change-password", pw);
      toast("Password changed", "success");
      setPw({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (err) {
      toast((err as Error).message, "danger");
    } finally {
      setChanging(false);
    }
  }

  // Same rules as the API: JPG/PNG/WebP up to 10 MB (it also accepts PDFs, which make no sense here).
  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return toast("Choose a JPG, PNG or WebP image", "danger");
    if (file.size > 10 * 1024 * 1024) return toast("The image must be under 10 MB", "danger");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("avatar", file);
      await navo.post("/upload-image/user", form);
      toast("Profile photo updated", "success");
      reload();
    } catch (err) {
      toast((err as Error).message, "danger");
    } finally {
      setUploading(false);
    }
  }

  async function logout() {
    await auth("logout").catch(() => null);
    router.replace("/login");
    router.refresh();
  }

  if (loading && !user) return <PageLoader />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-black text-navy">Profile</h1>

      <Card className="p-6 flex flex-wrap items-center gap-5">
        <div className="flex flex-col items-center gap-1.5">
          <div className="size-16 rounded-full bg-orange text-white flex items-center justify-center text-2xl font-black overflow-hidden">
            {user?.profilePicture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl(user.profilePicture)} alt="" className="size-full object-cover" />
            ) : (
              String(user?.accountName ?? "?").charAt(0)
            )}
          </div>
          <label className={`text-xs font-bold ${uploading ? "text-navy/40" : "text-orange cursor-pointer hover:underline"}`}>
            {uploading ? "Uploading…" : "Change photo"}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading} onChange={uploadPhoto} />
          </label>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xl font-black text-navy">{user?.accountName}</p>
          <p className="text-navy/60 text-sm">{user?.email} · {user?.countryOfResidence}</p>
        </div>
        <Badge tone={user?.isKycVerified ? "success" : "warning"}>{user?.isKycVerified ? "KYC verified" : "KYC not completed"}</Badge>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-black text-navy text-lg mb-5">Personal details</h2>
          <form onSubmit={save} className="space-y-4">
            <Field label="Phone number"><Input value={form.phoneNumber} onChange={set("phoneNumber")} /></Field>
            <Field label="Gender">
              <Select value={form.gender} onChange={set("gender")}>
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="others">Other</option>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="House no."><Input value={form.houseNo} onChange={set("houseNo")} /></Field>
              <Field label="Street"><Input value={form.street} onChange={set("street")} /></Field>
              <Field label="City"><Input value={form.city} onChange={set("city")} /></Field>
              <Field label="State"><Input value={form.state} onChange={set("state")} /></Field>
            </div>
            <Field label="Closest landmark"><Input value={form.closestLandmark} onChange={set("closestLandmark")} /></Field>
            <Button type="submit" loading={saving} className="w-full">Save changes</Button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-black text-navy text-lg mb-5">Change password</h2>
            <form onSubmit={changePassword} className="space-y-4">
              <Field label="Current password"><PasswordInput value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} autoComplete="current-password" /></Field>
              <Field label="New password"><PasswordInput value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} autoComplete="new-password" /></Field>
              <Field label="Confirm new password"><PasswordInput value={pw.confirmNewPassword} onChange={(e) => setPw({ ...pw, confirmNewPassword: e.target.value })} autoComplete="new-password" /></Field>
              <Button type="submit" variant="navy" loading={changing} className="w-full">Update password</Button>
            </form>
          </Card>
          <Card className="divide-y divide-navy/5">
            {[
              { href: "/security", label: "Transaction PIN & security questions" },
              { href: "/kyc", label: user?.isKycVerified ? "Identity verified" : "Verify your identity (KYC)" },
              { href: "/orders", label: "My orders" },
              { href: "/transactions", label: "Transactions" },
              { href: "/notifications", label: "Notifications" },
              { href: "/fx", label: "FX exchange" },
              { href: "/bills", label: "Bills & top-ups" },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="flex justify-between px-6 py-4 font-medium text-navy hover:bg-navy/[0.02]">
                {l.label}<span className="text-navy/40">›</span>
              </Link>
            ))}
          </Card>
          <Button variant="outline" onClick={logout} className="w-full">Log out</Button>
        </div>
      </div>
    </div>
  );
}
