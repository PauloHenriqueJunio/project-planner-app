import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
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
  return (
    <>
      <StatusBar barStyle="light-content" />
      <NavigationContainer>
        <ToastProvider>
          <ProjectProvider>
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: COLORS.background },
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
    </>
  );
}
