import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DriverViewPage } from './driver-view.page';

const routes: Routes = [
  {
    path: '',
    component: DriverViewPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DriverViewPageRoutingModule {}
