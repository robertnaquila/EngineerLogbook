import { Injectable } from '@angular/core';
import * as firebase from 'firebase/app';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  constructor(
    public toastCtrl:ToastController
  ) { }

  registerUser(value: { email:string, password:string; }) {
    return new Promise<any>( (resolve, reject) => {
      firebase.auth().createUserWithEmailAndPassword(value.email,value.password).then(
        res => resolve(res),
        err => reject(err)
      );
    });
  }

  loginUser(value: { email:string, password:string; }) {
    return new Promise<any>( (resolve, reject) => {
      firebase.auth().signInWithEmailAndPassword(value.email,value.password).then(
        res => resolve(res),
        err => {
          return reject(err);
        }
      );
    });
  }

  logoutUser() {
    console.log("> logout");
    return new Promise( (resolve, reject) => {
      if(firebase.auth().currentUser) {
        firebase.auth().signOut().then( () => {
          console.log('logout');
          resolve();          
        }).catch( (error) => {
          reject();
        });
      }
    });
  }

  userDetails() {
    return firebase.auth().currentUser;
  }

  resetPassword(email: string) {
    var auth = firebase.auth();
    return auth.sendPasswordResetEmail(email)
      .then(() => {
        console.log("email sent");
        this.showToast('An email is sent to reset your password.');
      })
      .catch((error) => {
        console.log(error);
        this.showToast(error);
      })
  }

  async showToast(data:any) {
    const toast = await this.toastCtrl.create({
      message: data,
      duration: 3000,
      position: 'top'
    });
    toast.present();
  }

}
