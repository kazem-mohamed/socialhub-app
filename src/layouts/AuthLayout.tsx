import { Outlet } from "react-router";
import { DocumentTitle } from "@/shared/ui/DocumentTitle";

/** Shell for the sign-in and sign-up screens. */
export default function AuthLayout() {
  return (
    <>
      <DocumentTitle />
      <Outlet />
    </>
  );
}
