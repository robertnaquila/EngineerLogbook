import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { DatabaseService, Drive, User } from '../database.service';
import * as dayjs from 'dayjs';
import { Router, NavigationExtras } from '@angular/router';

@Component({
  selector: 'app-commander',
  templateUrl: './commander.page.html',
  styleUrls: ['./commander.page.scss'],
})
export class CommanderPage implements OnInit {

  constructor(
    private navCtrl: NavController,
    public database: DatabaseService,
    private router: Router
  ) { }

  ngOnInit() {
  }

  public checkOperatorCurrencyValid(vehicletype:string, date:any) {
    const today = dayjs();
    var period = vehicletype === "M3G" ? 30 : 7;
    return today.diff(date,"day") < period;
  }

  public checkOperatorCurrencyInvalid(vehicletype:string, date:any) {
    const today = dayjs();
    var period = vehicletype === "M3G" ? 30 : 7;
    return today.diff(date,"day") > period;
  }

  public getPendingDrives() : Drive[] {
    return this.database.current.drive_history.filter( (drive) => {
      return drive.status === 'pending';
    });
  }

  public getApprovedDrives() : Drive[] {
    return this.database.current.drive_history.filter( (drive) => {
      return drive.status === 'verified';
    });
  }

  public click(drive:Drive) : void {
    this.database.current.drive_to_edit = drive;
    console.log(`> Navigating to AddDrivePage for drive id: ${drive.id}`);
    this.navCtrl.navigateForward(['/add-drive']);
  }

  openDriver(driver) {
    let navExtras: NavigationExtras = {
      state: {
        driver: driver
      }
    };
    console.log(`> Navigating to DriverViewPage for driver: ${driver.email}`);
    
    this.router.navigate(['driver-view'], navExtras);
  }

}
