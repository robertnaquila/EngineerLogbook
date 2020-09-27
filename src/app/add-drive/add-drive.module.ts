import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AddDrivePageRoutingModule } from './add-drive-routing.module';

import { AddDrivePage } from './add-drive.page';
import { RouterModule, Routes } from '@angular/router';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    AddDrivePageRoutingModule
  ],
  declarations: [AddDrivePage]
})
export class AddDrivePageModule {}
