import { auth } from "@/config/firebase";
import { goReplace } from "@/lib/nav";
import { authErrorMessage, loginUser, registerUser } from "@/services/auth";
import { ensureUserAccount, subscribeUserProfile, updateUserProfile, UserProfile } from "@/services/users";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";

/* -------------------------------------------------------------------------- */
/* Theme                                                                       */
/* -------------------------------------------------------------------------- */

export type ThemeMode = "light" | "dark";

type ThemeContextType = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function AppThemeProvider({
  children,
  initialTheme = "light",
}: {
  children: ReactNode;
  initialTheme?: ThemeMode;
}) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialTheme);
  const toggleThemeMode = () => setThemeMode((c) => (c === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, toggleThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useAppTheme must be used inside an AppThemeProvider");
  return context;
}

/* -------------------------------------------------------------------------- */
/* Auth / profile (Firebase Auth + live users/{uid} document)                  */
/* -------------------------------------------------------------------------- */

type LogInForm = { email: string; password: string };
type RegisterForm = { email: string; password: string; confirm: string; name: string; phone: string; business: string };

export type Owner = {
  name: string;
  phone: string;
  email: string;
  businessName: string;
  businessType: string;
  address: string;
};

type AuthContextType = {
  /** true while a sign-in / sign-up request is in flight */
  loading: boolean;
  /** Firebase has restored (or not) the previous session */
  authReady: boolean;
  /** the first profile snapshot has arrived (or failed) for the signed-in user */
  profileReady: boolean;
  uid: string | null;
  user: UserProfile | null;
  owner: Owner;
  logInForm: LogInForm;
  updateLogInField: (field: keyof LogInForm, value: string) => void;
  registerForm: RegisterForm;
  updateRegisterField: (field: keyof RegisterForm, value: string) => void;
  updateOwner: (patch: { name?: string; phone?: string; businessName?: string; businessType?: string; address?: string }) => Promise<void>;
  handleSignup: () => Promise<void>;
  handleLogin: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const emptyLogin: LogInForm = { email: "", password: "" };
const emptyRegister: RegisterForm = { email: "", password: "", confirm: "", name: "", phone: "", business: "" };
const emptyOwner: Owner = { name: "", phone: "", email: "", businessName: "", businessType: "", address: "" };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [logInForm, setLogInForm] = useState(emptyLogin);
  const [registerForm, setRegisterForm] = useState(emptyRegister);
  const profileErrorShown = useRef<string | null>(null);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      unsubProfile?.();
      unsubProfile = undefined;
      setUser(null);
      profileErrorShown.current = null;

      if (!fbUser) {
        setUid(null);
        setProfileReady(false);
        setAuthReady(true);
        return;
      }

      setUid(fbUser.uid);
      setProfileReady(false);
      setAuthReady(true);

      const reportProfileError = (error: unknown) => {
        if (auth.currentUser?.uid !== fbUser.uid) return;
        console.error("[auth] profile synchronization failed", error);
        setProfileReady(true);
        if (profileErrorShown.current === fbUser.uid) return;
        profileErrorShown.current = fbUser.uid;
        const code = (error as { code?: string })?.code;
        Alert.alert(
          code === "permission-denied" ? "Firebase access denied" : "Account sync problem",
          code === "permission-denied"
            ? "The signed-in account can't read its Firestore profile. Deploy the app's Firestore rules to the configured Firebase project, then sign in again."
            : "Your account details couldn't be synchronized. Check your connection and try again.",
        );
      };

      // Create / repair the account document (no-op when it's already fine).
      ensureUserAccount(fbUser).catch(reportProfileError);

      // Live profile: owner and business details update everywhere instantly.
      unsubProfile = subscribeUserProfile(
        fbUser.uid,
        (profile) => {
          setUser(profile);
          // a missing doc means ensureUserAccount is still creating it; wait for the next snapshot
          if (profile) setProfileReady(true);
        },
        reportProfileError,
      );
    });

    return () => {
      unsubProfile?.();
      unsubAuth();
    };
  }, []);

  const owner = useMemo<Owner>(() => {
    if (!uid) return emptyOwner;
    return {
      name: user?.displayName ?? auth.currentUser?.displayName ?? "",
      email: user?.email ?? auth.currentUser?.email ?? "",
      phone: user?.phone ?? "",
      businessName: user?.businessName ?? "",
      businessType: user?.businessType ?? "",
      address: user?.address ?? "",
    };
  }, [uid, user]);

  const handleSignup = async () => {
    if (loading) return;
    setLoading(true);
    let accountCreated = false;
    try {
      const fbUser = await registerUser(registerForm.email, registerForm.password);
      accountCreated = true;
      const displayName = registerForm.name.trim();
      await updateProfile(fbUser, { displayName });
      await ensureUserAccount(fbUser, { displayName, phone: registerForm.phone.trim(), businessName: registerForm.business.trim() });
      setRegisterForm(emptyRegister); // don't keep passwords in memory
      goReplace("/(tabs)/home");
    } catch (error: unknown) {
      if (accountCreated) {
        setRegisterForm((form) => ({ ...form, password: "", confirm: "" }));
        goReplace("/(tabs)/home");
        Alert.alert("Account created", "Your sign-in is ready, but some business details could not be saved. You can finish setting them up in your profile.");
      } else {
        Alert.alert("Signup failed", authErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await loginUser(logInForm.email, logInForm.password);
      setLogInForm(emptyLogin);
      goReplace("/(tabs)/home");
    } catch (error: unknown) {
      Alert.alert("Login failed", authErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const updateOwner: AuthContextType["updateOwner"] = async (patch) => {
    const fbUser = auth.currentUser;
    if (!fbUser) throw new Error("You must be signed in to update your profile.");
    const displayName = patch.name?.trim() ?? owner.name;
    const phone = patch.phone?.trim() ?? owner.phone;
    await updateProfile(fbUser, { displayName });
    await updateUserProfile(fbUser.uid, {
      displayName,
      phone,
      businessName: patch.businessName?.trim() ?? owner.businessName,
      businessType: patch.businessType ?? owner.businessType,
      address: patch.address?.trim() ?? owner.address,
    });
    // the live profile listener refreshes `owner`
  };

  return (
    <AuthContext.Provider
      value={{
        loading,
        authReady,
        profileReady,
        uid,
        user,
        owner,
        logInForm,
        updateLogInField: (f, v) => setLogInForm((p) => ({ ...p, [f]: v })),
        registerForm,
        updateRegisterField: (f, v) => setRegisterForm((p) => ({ ...p, [f]: v })),
        updateOwner,
        handleSignup,
        handleLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider");
  return context;
}
