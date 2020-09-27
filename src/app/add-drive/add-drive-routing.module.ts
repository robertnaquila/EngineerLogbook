import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AddDrivePage } from './add-drive.page';

const routes: Routes = [
  {
    path: '',
    component: AddDrivePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AddDrivePageRoutingModule {}
