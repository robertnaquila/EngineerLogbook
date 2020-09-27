import { Component, OnInit } from '@angular/core';
import { NavController, ToastController } from '@ionic/angular';
import { AuthenticationService } from '../authentication.service';
import { DatabaseService, User } from '../database.service';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
})
export class SignUpPage implements OnInit {

  errorMessage = '';
  successMessage = '';
  toast: any;
  segment: string = 'driver';

  driverForm:FormGroup = this.formBuilder.group({
    rank: new FormControl('', Validators.compose([
      Validators.required
    ])),
    name: new FormControl('', Validators.compose([
      Validators.required
    ])),
    email: new FormControl('', Validators.compose([
      Validators.required,
      Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$')
    ])),
    fleet: new FormControl('', Validators.compose([
      Validators.required
    ])),
    company: new FormControl('', Validators.compose([
      Validators.required
    ])),
    password: new FormControl('', Validators.compose([
      Validators.required,
      Validators.minLength(6),
      Validators.pattern('^.*[0-9].*$')
    ])),
    confirmPassword: new FormControl('', Validators.required),
    licenseNum: new FormControl('', Validators.compose([
      Validators.required,
      Validators.minLength(6)
    ])),
    licenseType: new FormControl('', Validators.compose([
      Validators.required
    ]))
  });    

  commanderForm: FormGroup = this.formBuilder.group({
    rank: new FormControl('', Validators.compose([
      Validators.required
    ])),
    name: new FormControl('', Validators.compose([
      Validators.required
    ])),
    email: new FormControl('', Validators.compose([
      Validators.required,
      Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$')
    ])),
    fleet: new FormControl('', Validators.compose([
      Validators.required
    ])),
    company: new FormControl('', Validators.compose([
      Validators.required
    ])),
    password: new FormControl('', Validators.compose([
      Validators.required,
      Validators.minLength(6),
      Validators.pattern('^.*[0-9].*$')
    ])),
    confirmPassword: new FormControl('', Validators.required),
    licenseNum: '',
    licenseType: ''
  });    


  validationMessages = {
    rank: [
      { type: 'required', message: 'Rank is required.' }
    ],
    name: [
      { type: 'required', message: 'Name is required.' }
    ],
    email: [
      { type: 'required', message: 'Email is required.' },
      { type: 'pattern', message: 'Enter a valid email.' }
    ],
    fleet: [
      { type: 'required', message: 'Unit is required.' }
    ],
    company: [
      { type: 'required', message: 'Company is required.' }
    ],
    password: [
      { type: 'required', message: 'Password is required.' },
      { type: 'minlength', message: 'Password must be at least 5 characters long.' },
      { type: 'pattern', message: 'Password must have at least 1 number.'}
    ],
    confirmPassword: [
      { type: 'required', message: 'You need to confirm your password.' }
    ],
    licenseNum: [
      { type: 'required', message: 'Licence Number is required.' },
      { type: 'minlength', message: 'Licence Number must be at least 5 characters.' }
    ],
    licenseType: [
      { type: 'required', message: 'Licence Type is required.' }
    ],
  };

  constructor(
    private navCtrl:NavController,
    private authService:AuthenticationService,
    private database:DatabaseService,
    private formBuilder:FormBuilder,
    public toastController:ToastController,
  ) { }

  ngOnInit() {
    /** 
    if(this.segment == 'driver') {
      this.driverForm = this.formBuilder.group({
        accountType: 'driver',
        rank: new FormControl('', Validators.compose([
          Validators.required
        ])),
        name: new FormControl('', Validators.compose([
          Validators.required
        ])),
        email: new FormControl('', Validators.compose([
          Validators.required,
          Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$')
        ])),
        fleet: new FormControl('', Validators.compose([
          Validators.required
        ])),
        company: new FormControl('', Validators.compose([
          Validators.required
        ])),
        password: new FormControl('', Validators.compose([
          Validators.required,
          Validators.minLength(6),
          Validators.pattern('^.*[0-9].*$')
        ])),
        confirmPassword: new FormControl('', Validators.required),
        licenseNum: new FormControl('', Validators.compose([
          Validators.required,
          Validators.minLength(6)
        ])),
        licenseType: new FormControl('', Validators.compose([
          Validators.required
        ]))
      });    
    } else {
      this.commanderForm = this.formBuilder.group({
        accountType: 'driver',
        rank: new FormControl('', Validators.compose([
          Validators.required
        ])),
        name: new FormControl('', Validators.compose([
          Validators.required
        ])),
        email: new FormControl('', Validators.compose([
          Validators.required,
          Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$')
        ])),
        fleet: new FormControl('', Validators.compose([
          Validators.required
        ])),
        company: new FormControl('', Validators.compose([
          Validators.required
        ])),
        password: new FormControl('', Validators.compose([
          Validators.required,
          Validators.minLength(6),
          Validators.pattern('^.*[0-9].*$')
        ])),
        confirmPassword: new FormControl('', Validators.required)
      });    
    }
    */
  }
  
  async tryRegister(value) {
    if((this.driverForm.get('password').value !== this.driverForm.get('confirmPassword').value) || (this.commanderForm.get('password').value !== this.commanderForm.get('confirmPassword').value)) {
      this.errorMessage = 'Password do not match.';
    } else {
      try {
        const res = await this.authService.registerUser(value);
        const default_photoURL = "https://firebasestorage.googleapis.com/v0/b/engineerslogbook-v1.appspot.com/o/profilePhoto%2Favatar.jpg?alt=media&token=e261ba39-1d03-44cd-9b0e-ff904026631f";

        if(this.segment === 'driver') {
          var new_user: User = {
            photoURL: default_photoURL,
            rank: value.rank,
            name: value.name,
            email: res.user.email,
            fleet: value.fleet,
            company: value.company,
            is_driver: true,
            license_num: value.licenseNum,
            license_type: value.licenseType,
            created: this.database.getTimeStamp()
          };  
        } else {
          if(!this.commanderForm.get('licenseNum').value) {
            var new_user: User = {
              photoURL: default_photoURL,
              rank: value.rank,
              name: value.name,
              email: res.user.email,
              fleet: value.fleet,
              company: value.company,
              is_commander: true,
              created: this.database.getTimeStamp()
            };  
            console.log('No input license details.');
          } else {
            var new_user: User = {
              photoURL: default_photoURL,
              rank: value.rank,
              name: value.name,
              email: res.user.email,
              fleet: value.fleet,
              company: value.company,
              is_commander: true,
              license_num: value.licenseNum,
              license_type: value.licenseType,
              created: this.database.getTimeStamp()
            };  
          }
        }

        await this.database.write('user', res.user.email, new_user);

        this.errorMessage = '';
        this.successMessage = 'Your account has been created. Please log in.';
        this.showToast(this.successMessage);
      } catch(err) {
        console.log(err);
        this.errorMessage = err.message;
        this.successMessage = '';
      }
    }
  }

  goLoginPage() {
    this.navCtrl.navigateBack('');
  }
  
  async showToast(msg) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 2000,
      position: 'middle',
      buttons: [{
        text: 'OK',
          role: 'cancel',
          handler: () => {
            this.navCtrl.navigateBack('/');
          }
      }]
    });
    toast.present();
  }

  segmentChanged(ev:any) {
    console.log(this.segment);
    console.log(ev);
    if(this.segment=='commander') this.driverForm.reset();
    if(this.segment=='driver') this.commanderForm.reset();
  }  
}
