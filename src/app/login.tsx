import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/lib/auth-context";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const theme = useTheme();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (values: LoginForm) => {
    setFormError(null);
    setIsSubmitting(true);
    try {
      await login(values.username, values.password);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to sign in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.safeArea}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <ThemedText type="eyebrow" themeColor="accent">
              YOUTH MINISTRY
            </ThemedText>
            <ThemedText type="display">Welcome back.</ThemedText>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.subtitle}
            >
              Sign in to continue.
            </ThemedText>

            <ThemedText type="small" style={styles.label}>
              Username
            </ThemedText>
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="jsmith"
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.border,
                    },
                  ]}
                />
              )}
            />
            {errors.username && (
              <ThemedText type="small" themeColor="danger">
                {errors.username.message}
              </ThemedText>
            )}

            <ThemedText type="small" style={styles.label}>
              Password
            </ThemedText>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  autoCapitalize="none"
                  secureTextEntry
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.border,
                    },
                  ]}
                />
              )}
            />
            {errors.password && (
              <ThemedText type="small" themeColor="danger">
                {errors.password.message}
              </ThemedText>
            )}

            {formError && (
              <ThemedText
                type="small"
                themeColor="danger"
                style={styles.formError}
              >
                {formError}
              </ThemedText>
            )}

            <Pressable
              disabled={isSubmitting}
              onPress={handleSubmit(onSubmit)}
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: theme.accent,
                  opacity: pressed || isSubmitting ? 0.8 : 1,
                },
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={theme.accentText} />
              ) : (
                <ThemedText type="buttonLabel" themeColor="accentText">
                  SIGN IN
                </ThemedText>
              )}
            </Pressable>

            <Link href="/register" style={styles.linkWrap}>
              <ThemedText type="link" themeColor="accent">
                New here? Create an account
              </ThemedText>
            </Link>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { padding: Spacing.four, paddingTop: Spacing.six, gap: Spacing.one },
  subtitle: { marginBottom: Spacing.four },
  label: { marginTop: Spacing.three, marginBottom: Spacing.one },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontSize: 16,
  },
  formError: { marginTop: Spacing.two },
  button: {
    marginTop: Spacing.five,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  linkWrap: { marginTop: Spacing.four, alignSelf: "center" },
});
