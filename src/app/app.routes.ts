import { Routes } from "@angular/router";

import { Login } from "./login/login";
import { Signup } from "./signup/signup";
import { User } from "./user/user";
import { Dashboard } from "./dashboard/dashboard";
import { DashboardLayout } from "./layout/dashboard-layout/dashboard-layout";
import { Employee } from "./employee/employee";
import { ResetPassword } from "./reset-password/reset-password";
import { Patients } from "./patients/patients";
import { Appointment } from "./appointment/appointment";

export const routes: Routes = [
  /* DEFAULT */
  { path: "", redirectTo: "login", pathMatch: "full" },

  /* AUTH */
  { path: "login", component: Login },
  { path: "signup", component: Signup },

  /* RESET PASSWORD (OUTSIDE LAYOUT) */
  { path: "reset-password", component: ResetPassword },

  /* DASHBOARD LAYOUT */
  {
    path: "",
    component: DashboardLayout,
    children: [
      { path: "dashboard", component: Dashboard },
      { path: "profile", component: User },
      { path: "employees", component: Employee },
      { path: "patients", component: Patients },
      { path: "appointments", component: Appointment },
    ],
  },
];