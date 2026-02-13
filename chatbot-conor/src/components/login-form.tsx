import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "react-router";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Send password and email to
    // Returns a promise object
    const response = await authClient.signIn.email({ email, password });
    if (response.error) {
      alert("Login Failed");
    } else {
      navigate("/new");
    }
  };

  const handleSignUp = async () => {
    // React batches state update. No render, no update
    //setName(email);
    const response = await authClient.signUp.email({
      email,
      name: email,
      password,
    });
    if (response.error) {
      alert("Signup Failed");
    } else {
      navigate("/new");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                  }}
                />
              </Field>
              <Field>
                <Button type="submit" className="cursor-pointer">Login</Button>

                <FieldDescription className="text-center">
                  Don&apos;t have an account?
                </FieldDescription>
                <Button type="button" className="cursor-pointer" onClick={handleSignUp}>
                  Sign up
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
