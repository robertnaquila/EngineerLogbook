import { Component, OnInit, Input } from '@angular/core';
import { NavController } from '@ionic/angular';
import { DatabaseService, Drive } from '../database.service';
import * as dayjs from 'dayjs';

@Component({
  selector: 'app-drive-view',
  templateUrl: './drive-view.component.html',
  styleUrls: ['./drive-view.component.scss'],
})
export class DriveViewComponent implements OnInit {

  @Input() drive:Drive;

  constructor(
    private navCtrl:NavController,
    private database:DatabaseService
  ) { }

  ngOnInit() {}

  click() {
    this.database.current.drive_to_edit = this.drive;
    console.log(`> Navigating to AddDrivePage for drive id: ${this.drive.id}`);
    this.navCtrl.navigateForward(['/add-drive']);
  }

  public formatDate(date:string) : string {
    return dayjs(date, 'YYYY-MM-DD').format('D MMM YY (ddd)');
  }
}
