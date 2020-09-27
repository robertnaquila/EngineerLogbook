import { Component, OnInit } from '@angular/core';
import { NavController, LoadingController, AlertController, ToastController } from '@ionic/angular';
import { AuthenticationService } from '../authentication.service';
import { DatabaseService } from '../database.service';
import { MessagingService } from '../messaging.service';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  validationsForm: FormGroup;
  errorMessage = '';

  validationMessages = {
    email: [
      { type: 'required', message: 'Email is required.' },
      { type: 'pattern', message: 'Invalid email.' }
    ],
    password: [
      { type: 'required', message: 'Password is required.' },
      { type: 'minlength', message: 'Password must be at least 6 characters long.' }
    ]
  };

  constructor(
    private navCtrl: NavController,
    private authService: AuthenticationService,
    private database: DatabaseService,
    private messaging: MessagingService,
    private formBuilder: FormBuilder,
    private loadingCtrl: LoadingController,
    private storage: Storage,
    public alertCtrl: AlertController,
    public toastCtrl: ToastController
  ) { }

  private loading;
  public debuggine_mode = true;
  public toggle_dark_mode = false;

  ngOnInit() {
    this.debuggine_mode = !environment.production;
    this.validationsForm = this.formBuilder.group({
      email: new FormControl('', Validators.compose([
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$')
      ])),
      password: new FormControl('', Validators.compose([
        Validators.required,
        Validators.minLength(6)
      ]))
    });

    // Restore used user/password
    this.storage.get('email').then(value => {
      this.validationsForm.get('email').setValue(value);
    });
    this.storage.get('password').then(value => {
      this.validationsForm.get('password').setValue(value);
    });

    // Query for the toggle used to change between themes
    // Note: "dark" colors are defined in theme/variables.scss
    const toggle: any = document.querySelector('#themeToggle');
    toggle.addEventListener('ionChange', (ev: any) => {
      document.body.classList.toggle('dark', ev.detail.checked);
      this.storage.set('dark', ev.detail.checked);
    });
    this.storage.get('dark').then(value => {
      document.body.classList.toggle('dark', value);
      this.toggle_dark_mode = value;
    });
  }

  async loginUser(input) {
    console.log(`> Attempting login: ${input.email}`);

    // Loading spinner overlay
    this.loading = await this.loadingCtrl.create({
      message: "Authenticating..."
    });
    this.loading.present();

    try {
      // Authenticate user
      var res = await this.authService.loginUser(input);
      console.log(`> Firebase authentication is successful: ${res.user.email}`);

      // Init database, retrieve user/drives info
      this.setLoadingText("Reading database...");
      await this.database.init(res.user.email);
      console.log(`> Finished loading user: ${res.user.email}`);

      // Init cloud messaging/notifications
      this.setLoadingText("Initialising cloud messaging...");
      await this.messaging.init(res.user.email);

      this.setLoadingText("Login success.");
      setTimeout(() => {
        this.loading.dismiss();
      }, 2000);

      // Done initialisation
      if (this.database.current.user.is_commander) {
        this.navCtrl.navigateForward('/tabs/commander');
      } else {
        this.navCtrl.navigateForward('/tabs/summary');
      }
      this.errorMessage = '';

      // On successful login, save it
      this.storage.set('email', input.email);
      this.storage.set('password', input.password);
    } catch (err) {
      this.loading.dismiss();
      this.errorMessage = `Login failed. ${err}`;
    }
  }

  private setLoadingText(text: string) {
    const elem = document.querySelector("div.loading-wrapper div.loading-content");
    if (elem) elem.innerHTML = text;
  }

  async resetPassword() {
    const alert = await this.alertCtrl.create({
      header: 'Reset Password',
      message: "Enter a valid email address to reset your password.",
      inputs: [{
        name: 'email',
        type: 'email',
        placeholder: 'Email address'
      }],
      buttons: [{
        text: 'Cancel',
        role: 'cancel',
        handler: () => {
          console.log('Aborted reset password.');
        }
      }, {
        text: 'Confirm',
        handler: (data) => {
          if (data.email) {
            console.log('Attempting to reset password.');
            this.authService.resetPassword(data.email);
            return;
          } else {
            this.showToast('Enter a valid email.');
            return;
          }
        }
      }]
    });
    await alert.present();
  }

  async showToast(data: any) {
    const toast = await this.toastCtrl.create({
      message: data,
      duration: 3000,
      position: 'top'
    });
    toast.present();
  }

  private debug(who) {
    if (who === 'driver') {
      this.validationsForm.get('email').setValue('tan97@gmail.com');
      this.validationsForm.get('password').setValue('123456');
    } else
      if (who === 'commander') {
        this.validationsForm.get('email').setValue('lee55@gmail.com');
        this.validationsForm.get('password').setValue('123456');
      } else
        if (who === 'admin') {
          this.validationsForm.get('email').setValue('superuser@gmail.com');
          this.validationsForm.get('password').setValue('123456');
        }
  }

}
