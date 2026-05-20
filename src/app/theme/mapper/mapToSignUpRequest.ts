import { SignUpModel } from '../../models/auth.model';

export function mapToSignUpRequest(form: any): SignUpModel {
  return {
    name: form.value.name,
    email: form.value.email,
    password: form.value.password,
    roles: form.value.selectedRoles,
    department: form.value.department?? null,
    designation: form.value.designation,
    status: form.value.status,
    joiningDate: form.value.joiningDate,
    medicalRegistrationNo: form.value.medicalRegistrationNo ?? null,
    specialization: form.value.specialization ?? null,
    qualification: form.value.qualification,
    consultationFee: form.value.consultationFee ?? null,
    availabilitySlots: form.value.availabilitySlots?.length ? form.value.availabilitySlots : null,
  };
}
