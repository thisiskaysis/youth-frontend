import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { useState, type ComponentProps } from "react";
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

const registerSchema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  username: z.string().min(3, "At least 3 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const theme = useTheme();
  const { register } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      username: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: RegisterForm) => {
    setFormError(null);
    setIsSubmitting(true);
    try {
      await register(values);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to create your account.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const fields: {
    name: keyof RegisterForm;
    label: string;
    props?: Partial<ComponentProps<typeof TextInput>>;
  }[] = [
    { name: "first_name", label: "First name" },
    { name: "last_name", label: "Last name" },
    { name: "username", label: "Username", props: { autoCapitalize: "none" } },
    {
      name: "email",
      label: "Email",
      props: { autoCapitalize: "none", keyboardType: "email-address" },
    },
    { name: "password", label: "Password", props: { secureTextEntry: true } },
  ];

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
            <ThemedText type="display">Join us.</ThemedText>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.subtitle}
            >
              Every new account starts as a standard member - a leader can grant
              extra access later.
            </ThemedText>

            {fields.map(({ name, label, props }) => (
              <ThemedView key={name} type="background">
                <ThemedText type="small" style={styles.label}>
                  {label}
                </ThemedText>
                <Controller
                  control={control}
                  name={name}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      placeholderTextColor={theme.textSecondary}
                      style={[
                        styles.input,
                        {
                          color: theme.text,
                          backgroundColor: theme.backgroundElement,
                          borderColor: theme.border,
                        },
                      ]}
                      {...props}
                    />
                  )}
                />
                {errors[name] && (
                  <ThemedText type="small" themeColor="danger">
                    {errors[name]?.message}
                  </ThemedText>
                )}
              </ThemedView>
            ))}

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
                  CREATE ACCOUNT
                </ThemedText>
              )}
            </Pressable>

            <Link href="/login" style={styles.linkWrap}>
              <ThemedText type="link" themeColor="accent">
                Already have an account? Sign in
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
  linkWrap: {
    marginTop: Spacing.four,
    marginBottom: Spacing.six,
    alignSelf: "center",
  },
});
