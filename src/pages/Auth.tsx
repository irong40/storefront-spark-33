import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Leaf } from "lucide-react";
import { useDocumentTitle } from "@/hooks/use-document-title";

type AuthMode = "login" | "signup" | "forgot-password";

export default function Auth() {
  useDocumentTitle("Sign In");
  const navigate = useNavigate();
  const { user, signIn, signUp, resetPassword, isLoading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();

  const [mode, setMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  });

  // Redirect if already logged in - admins go to /admin, others to /account
  useEffect(() => {
    if (user && !authLoading && !isAdminLoading) {
      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/account");
      }
    }
  }, [user, authLoading, isAdmin, isAdminLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const { error } = await signIn(loginData.email, loginData.password);

    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
    // Let useEffect handle the redirect after admin status is checked
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (signupData.password !== signupData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (signupData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(
      signupData.email,
      signupData.password,
      signupData.fullName,
    );

    if (error) {
      if (error.message.includes("already registered")) {
        setError(
          "An account with this email already exists. Please sign in instead.",
        );
      } else {
        setError(error.message);
      }
      setIsLoading(false);
    } else {
      setSuccess("Account created! You can now sign in.");
      setSignupData({
        email: "",
        password: "",
        confirmPassword: "",
        fullName: "",
      });
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    const { error } = await resetPassword(forgotEmail);

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Check your email for a password reset link.");
    }
    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 py-12">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <Leaf className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Welcome to imPRESSive
            </h1>
            <p className="text-muted-foreground mt-2">
              Sign in or create an account to track orders and more
            </p>
          </div>

          {/* Auth Forms */}
          <div className="bg-card rounded-2xl border border-border p-6">
            {mode === "forgot-password" ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <h2 className="text-lg font-semibold text-center mb-2">Reset Password</h2>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Enter your email and we'll send you a reset link.
                </p>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="you@example.com"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Send Reset Link
                </Button>

                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                  className="w-full text-sm text-primary hover:underline"
                >
                  Back to Sign In
                </button>
              </form>
            ) : (
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Create Account</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) =>
                        setLoginData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      required
                      disabled={isLoading}
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Password</Label>
                      <button
                        type="button"
                        onClick={() => { setMode("forgot-password"); setError(""); setSuccess(""); }}
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) =>
                        setLoginData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      required
                      disabled={isLoading}
                      placeholder="••••••••"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Form */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  {success && (
                    <Alert>
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={signupData.fullName}
                      onChange={(e) =>
                        setSignupData((prev) => ({
                          ...prev,
                          fullName: e.target.value,
                        }))
                      }
                      disabled={isLoading}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupData.email}
                      onChange={(e) =>
                        setSignupData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      required
                      disabled={isLoading}
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signupData.password}
                      onChange={(e) =>
                        setSignupData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      required
                      disabled={isLoading}
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirm Password</Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      value={signupData.confirmPassword}
                      onChange={(e) =>
                        setSignupData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      required
                      disabled={isLoading}
                      placeholder="••••••••"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Account
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    By creating an account, you agree to our terms and privacy
                    policy.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
            )}
          </div>

          {/* Guest Checkout */}
          <p className="text-center text-muted-foreground mt-6">
            Just want to order?{" "}
            <Link to="/products" className="text-primary hover:underline">
              Continue as guest
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
