import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MedicalRecordService } from '../../../../services/medical-record.service';
import { MedicalRecordModel } from '../../../../models/medical-record.model';

@Component({
  selector: 'app-view-medical-record',
  imports: [CommonModule],
  templateUrl: './view-medical-record.html',
  styleUrl: './view-medical-record.css',
})
export class ViewMedicalRecordComponent implements OnInit{
  route : ActivatedRoute = inject(ActivatedRoute);
  medicalRecordService : MedicalRecordService = inject(MedicalRecordService);
  cd : ChangeDetectorRef = inject(ChangeDetectorRef);

  record : MedicalRecordModel | null = null;

  patientName = "";
  doctorName = "";

  ngOnInit(): void {
    const medicalRecordId = this.route.snapshot.paramMap.get("medicalRecordId");
    const state = history.state;

    this.patientName = state.patientName;
    this.doctorName = state.doctorName;

    if(medicalRecordId){
      this.loadRecordData(medicalRecordId);
    }
  }

  loadRecordData(medicalRecordId: string){
    this.medicalRecordService.getMedicalRecordById(medicalRecordId).subscribe((res)=>{
      this.record = res;
      this.cd.detectChanges();
    })
  }
}
