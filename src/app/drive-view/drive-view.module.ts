import { NgModule } from "@angular/core";
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { DriveViewComponent } from './drive-view.component';

@NgModule({
    imports: [
        CommonModule,
        IonicModule
    ],
    declarations: [DriveViewComponent],
    exports: [DriveViewComponent]
})
export class DriveViewModule {}