import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const githubConfigured = !!(process.env.GITHUB_ID && process.env.GITHUB_ID !== "mock-github-id");
  const googleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== "mock-google-id");

  return (
    <LoginForm
      githubConfigured={githubConfigured}
      googleConfigured={googleConfigured}
    />
  );
}
