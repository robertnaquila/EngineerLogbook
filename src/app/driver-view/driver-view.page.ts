import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as dayjs from 'dayjs';

@Component({
  selector: 'app-driver-view',
  templateUrl: './driver-view.page.html',
  styleUrls: ['./driver-view.page.scss'],
})
export class DriverViewPage implements OnInit {

  driver: any;

  constructor(
    private route:ActivatedRoute,
    private router:Router
  ) {
    this.route.queryParams.subscribe(params => {
      if(this.router.getCurrentNavigation().extras.state) {
        this.driver = this.router.getCurrentNavigation().extras.state.driver;
      }
    });
  }

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

}
