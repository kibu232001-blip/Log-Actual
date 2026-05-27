import { CapacitorConfig } from "@capacitor/cli";
const config: CapacitorConfig = {
  appId: "com.kibuglobal.logactual", appName: "LOG ACTUAL", webDir: "dist",
  server: { androidScheme: "https" },
  plugins: { StatusBar: { style: "dark", backgroundColor: "#0d1f0f" } },
};
export default config;