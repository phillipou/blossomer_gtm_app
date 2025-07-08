import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { SignIn, SignUp, useUser } from "@stackframe/react";

export function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get("mode") || "signin";
  const containerRef = useRef<HTMLDivElement>(null);
  const user = useUser();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // Find all anchor tags that link to sign-in or sign-up
    const links = Array.from(container.querySelectorAll("a")).filter(
      (a) =>
        (a.textContent?.toLowerCase().includes("sign up") && mode !== "signup") ||
        (a.textContent?.toLowerCase().includes("sign in") && mode !== "signin")
    );
    const handleClick = (e: Event) => {
      e.preventDefault();
      if ((e.target as HTMLAnchorElement).textContent?.toLowerCase().includes("sign up")) {
        navigate("/auth?mode=signup");
      } else {
        navigate("/auth?mode=signin");
      }
    };
    links.forEach((a) => a.addEventListener("click", handleClick));
    return () => {
      links.forEach((a) => a.removeEventListener("click", handleClick));
    };
  }, [mode, navigate]);

  // If user is already signed in, redirect to /company
  useEffect(() => {
    if (user) {
      navigate('/company');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-100">
      <div
        ref={containerRef}
        className="w-full max-w-md p-8 border border-gray-200 rounded-lg shadow-md bg-white flex flex-col items-center"
      >
        {mode === "signup" ? (
          <SignUp 
            oauthScope={{
              google: ['email', 'profile']
            }}
            allowAccountLinking={true}
          />
        ) : (
          <SignIn 
            oauthScope={{
              google: ['email', 'profile']
            }}
            allowAccountLinking={true}
          />
        )}
      </div>
    </div>
  );
}