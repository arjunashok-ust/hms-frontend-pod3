import { Routes } from '@angular/router';
import { LoginComponent } from './theme/login/login';
import { SignUpComponent } from './theme/signup/signup';
import { HomeComponent } from './theme/home/home';
import { UserProfileComponent } from './theme/home/user-profile/user-profile';
import { DashboardComponent } from './theme/home/dashboard/dashboard';
import { AppointmentComponent } from './theme/home/appointment/appointment';
import { PasswordModalComponent } from './theme/home/modal/password-modal/password-modal';
import { EmployeeComponent } from './theme/home/employee/employee';
import { SignUpModalComponent } from './theme/home/modal/signup-modal/signup-modal';
import { ApprovalComponent } from './theme/home/approval/approval';
import { PatientComponent } from './theme/home/patient/patient';
import { EditEmployeeComponent } from './theme/home/modal/edit-employee/edit-employee';
import { AccessDeniedComponent } from './theme/home/modal/access-denied/access-denied';
import { NotFoundComponent } from './theme/home/modal/not-found/not-found';
import { RouteGuard } from './services/guard/route.guard';
import { EditPatientComponent } from './theme/home/modal/edit-patient/edit-patient';
import { MedicalRecordComponent } from './theme/home/medical-record/medical-record';
import { ViewMedicalRecordComponent } from './theme/home/modal/view-medical-record/view-medical-record';
import { PermissionComponent } from './theme/home/permission/permission';
import { NodeComponent } from './theme/home/node/node';
import { authRedirectGuard } from './services/guard/redirect.guard';
import { ForgotPasswordComponent } from './theme/home/modal/forgot-password/forgot-password';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authRedirectGuard],
    children: [],
  },
  {
    path: '',
    component: HomeComponent,
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [RouteGuard],
        data: { permissions: ['view:dashboard'] },
      },
      {
        path: 'profile',
        component: UserProfileComponent,
        canActivate: [RouteGuard],
        data: { permissions: ['view:profile'] },
      },
      {
        path: 'appointment',
        component: AppointmentComponent,
        canActivate: [RouteGuard],
        data: { permissions: ['view:appointment'] },
      },
      {
        path: 'employee',
        component: EmployeeComponent,
        canActivate: [RouteGuard],
        data: { permissions: ['view:employee'] },
      },
      { path: 'password-modal', component: PasswordModalComponent },
      { path: 'signup-modal', component: SignUpModalComponent },
      {
        path: 'approval',
        component: ApprovalComponent,
        canActivate: [RouteGuard],
        data: { permissions: ['view:approval'] },
      },
      {
        path: 'patient',
        component: PatientComponent,
        canActivate: [RouteGuard],
        data: { permissions: ['view:patient'] },
      },
      {
        path: 'edit-employee',
        component: EditEmployeeComponent,
        canActivate: [RouteGuard],
        data: { permissions: ['edit:employee', 'edit:profile'] },
      },
      {
        path: 'edit-patient',
        component: EditPatientComponent,
        canActivate: [RouteGuard],
        data: { permissions: ['view:patient'] },
      },
      {
        path: 'medical-record',
        component: MedicalRecordComponent,
        canActivate: [RouteGuard],
        data: { permissions: ['view:medical-record'] },
      },
      {
        path: 'medical-record/:medRecordId',
        component: MedicalRecordComponent,
        canActivate: [RouteGuard],
        data: { permissions: ['view:medical-record'] },
      },
      {
        path: 'view-medical-record/:medicalRecordId',
        component: ViewMedicalRecordComponent,
        canActivate: [RouteGuard],
        data: { permissions: ['view:medical-record'] },
      },
      {
        path: 'permission',
        component: PermissionComponent,
        canActivate: [RouteGuard],
        data: { permissions: ['view:permission'] },
      },
      {
        path: 'node',
        component: NodeComponent,
        canActivate: [RouteGuard],
        data: { permissions: ['view:node'] },
      },
    ],
  },
  { path: 'login', component: LoginComponent },
  { path: 'signUp', component: SignUpComponent },
  { path: 'access-denied', component: AccessDeniedComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: '**', component: NotFoundComponent },
];
