import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { DatabaseService } from './database.service';
import { FCM } from '@ionic-native/fcm/ngx';

@Injectable({
  providedIn: 'root'
})
export class MessagingService {

  constructor(
    private platform: Platform,
    private database: DatabaseService,
    private fcm: FCM // Firebase Cloud Messaging
  ) { }

  public init(email:string) {
    // Setup Firebase Cloud Messaging -- token handling, notifications in fore-/background
    if(this.platform.is('cordova')) {
      console.log(`> FCM: Initialising cloud messaging services: ${email}`);
      this.fcm.getToken().then(token => {
        console.log(`> FCM: Token received: ${token}`);
        const doc = {
          token,
          userId: email
        };
        this.database.write('devices', email, doc);
      });
      this.fcm.onTokenRefresh().subscribe(token => {
        console.log(`> FCM: Token refreshed: ${token}`);
        console.log(token);     
      });
      this.fcm.onNotification().subscribe(data => {
        if(data.wasTapped) {
          console.log(`> FCM: Received in background: ${data}`);         
        } else {
          console.log(`> FCM: Received token in foreground: ${data}`);
        }
      });
      console.log(`> FCM: Initialisation ok.`);
    }
  }
}
