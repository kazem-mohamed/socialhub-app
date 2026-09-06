import { Navigate, useParams } from "react-router";

/** Sends `/PostDetails/:postId` to the current `/post/:postId`. */
export function LegacyPostRedirect() {
  const { postId } = useParams();
  return <Navigate to={`/post/${postId ?? ""}`} replace />;
}
