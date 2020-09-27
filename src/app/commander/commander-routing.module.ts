import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CommanderPage } from './commander.page';

const routes: Routes = [
  {
    path: '',
    component: CommanderPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CommanderPageRoutingModule {}
