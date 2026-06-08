import "react-native-gesture-handler";
import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { Platform, View } from "react-native";
import { ProjectProvider } from "./src/context/ProjectContext";
import { ToastProvider } from "./src/context/ToastContext";
import ToastContainer from "./src/components/ToastContainer";

import DashboardScreen from "./src/screens/DashboardScreen";
import CreateProjectScreen from "./src/screens/CreateProjectScreen";
import ProjectDetailScreen from "./src/screens/ProjectDetailScreen";
import TrackingScreen from "./src/screens/TrackingScreen";
import ChatScreen from "./src/screens/ChatScreen";
import { COLORS } from "./src/constants/colors";

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;

    const { body, documentElement } = document;
    const root = document.getElementById("root");
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousBodyHeight = body.style.height;
    const previousHtmlHeight = documentElement.style.height;
    const previousBodyOverscroll = body.style.overscrollBehavior;
    const previousRootHeight = root?.style.height;

    body.style.overflow = "hidden";
    documentElement.style.overflow = "hidden";
    body.style.height = "100%";
    documentElement.style.height = "100%";
    body.style.overscrollBehavior = "none";
    if (root) root.style.height = "100%";

    return () => {
      body.style.overflow = previousBodyOverflow;
      documentElement.style.overflow = previousHtmlOverflow;
      body.style.height = previousBodyHeight;
      documentElement.style.height = previousHtmlHeight;
      body.style.overscrollBehavior = previousBodyOverscroll;
      if (root) root.style.height = previousRootHeight || "";
    };
  }, []);

  const appStyle =
    Platform.OS === "web"
      ? { flex: 1, height: "100dvh", overflow: "hidden" }
      : { flex: 1 };

  return (
    <>
      <StatusBar barStyle="light-content" />
      <View style={appStyle}>
        <NavigationContainer>
          <ToastProvider>
            <ProjectProvider>
              <Stack.Navigator
                screenOptions={{
                  headerShown: false,
                  cardStyle: { flex: 1, backgroundColor: COLORS.background },
                }}
              >
                <Stack.Screen
                  name="Dashboard"
                  component={DashboardScreen}
                  options={{ animationEnabled: true }}
                />
                <Stack.Screen
                  name="CreateProject"
                  component={CreateProjectScreen}
                  options={{ animationEnabled: true }}
                />
                <Stack.Screen
                  name="ProjectDetail"
                  component={ProjectDetailScreen}
                  options={{ animationEnabled: true }}
                />
                <Stack.Screen
                  name="Tracking"
                  component={TrackingScreen}
                  options={{ animationEnabled: true }}
                />
                <Stack.Screen
                  name="Chat"
                  component={ChatScreen}
                  options={{ animationEnabled: true }}
                />
              </Stack.Navigator>
              <ToastContainer />
            </ProjectProvider>
          </ToastProvider>
        </NavigationContainer>
      </View>
    </>
  );
}
