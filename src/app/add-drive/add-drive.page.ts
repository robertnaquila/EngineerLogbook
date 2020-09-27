import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { NavController, ToastController, AlertController } from '@ionic/angular';
import { DatabaseService, Drive } from '../database.service';
import { ActivatedRoute } from '@angular/router';
import * as dayjs from 'dayjs';

@Component({
  selector: 'app-add-drive',
  templateUrl: './add-drive.page.html',
  styleUrls: ['./add-drive.page.scss'],
})
export class AddDrivePage implements OnInit {

  addDriveForm: FormGroup;
  errorMessage = "";
  successMessage = "";
  toast: any;
  today = new Date().toISOString();
  drive;
  updateStatus;
  showStatus = true;
  isToggled = false;
  isDisabled;
  showJIT = false;

  validationMessages = {
    date: [{
      type: 'required',
      message: 'Date is required.'
    }],
    vehicleNumber: [{
      type: 'required',
      message: 'Vehicle number is required.'
    }, {
      type: 'minlength',
      message: 'Vehicle number must be at least 5 characters long.'
    }],
    vehicleType: [{
      type: 'required',
      message: 'Select a type of vehicle.'
    }],
    vehicleCommander: [{
      type: 'required',
      message: 'Select a Vehicle Commander.'
    }],
    startLocation: [{
      type: 'required',
      message: 'Enter starting location.'
    }],
    startOdometer: [{
      type: 'required',
      message: 'Enter current odometer reading.'
    }],
    startTime: [{
      type: 'required',
      message: 'Enter current time.'
    }],
    endLocation: [{
      type: 'required',
      message: 'Enter destination.'
    }],
    endOdometer: [{
      type: 'required',
      message: 'Enter final odometer reading.'
    }],
    endTime: [{
      type: 'required',
      message: 'Enter final time.'
    }],
    fuelLevel: [{
      type: 'required',
      message: 'Indicate final fuel level.'
    }]
  };

  constructor(
    private navCtrl: NavController,
    private formBuilder: FormBuilder,
    public toastController: ToastController,
    public database: DatabaseService,
    public route: ActivatedRoute,
    public alertCtrl: AlertController
  ) { }

  ngOnInit() {

    // Create form group of controls
    this.addDriveForm = this.formBuilder.group({
      date: new FormControl(this.today, Validators.compose([Validators.required])),
      vehicleNumber: new FormControl('', Validators.compose([Validators.required, Validators.minLength(5)])),
      vehicleType: new FormControl('', Validators.compose([Validators.required])),
      vehicleCommander: new FormControl('', Validators.compose([Validators.required])),
      startLocation: new FormControl('', Validators.compose([Validators.required])),
      startOdometer: new FormControl('', Validators.compose([Validators.required])),
      startTime: new FormControl(this.today, Validators.compose([Validators.required])),
      endLocation: new FormControl('', Validators.compose([Validators.required])),
      endOdometer: new FormControl('', Validators.compose([Validators.required])),
      endTime: new FormControl('', Validators.compose([Validators.required])),
      maintenance: new FormControl(''),
      fuelLevel: new FormControl('', Validators.compose([Validators.required])),
      driveComments: new FormControl(''),
      driveStatus: new FormControl(''),
      radioVerify: new FormControl({ value: '', disabled: true }),
      radioReject: new FormControl({ value: '', disabled: true }),
      // Only for GSB
      initEngineHr: '',
      finalEngineHr: '',
    });

    // Get the drive the user selected
    this.drive = this.database.current.drive_to_edit;
    if (this.drive != null) {
      console.log('In add drive page: drive id: ' + this.drive.id);
    }

    // Has gotten the info so reset drive_to_edit
    this.database.current.drive_to_edit = null;

    // If user did not select any drive, check if there is incomplete drive
    if (this.drive == null) {
      this.drive = this.database.current.drive_in_progress;
    }
    if (this.drive) {
      console.log('drive status: ' + this.drive.status);
      console.log('is commander: ' + this.database.current.user.is_commander);
    }
    if (this.drive == null) {  // start a new drive
      this.startDriveControls();
      this.updateStatus = false;
      this.isDisabled = false;
      this.showStatus = false;
    } else { // retrieving an existing drive
      if (this.database.current.user.is_admin) {
        console.log('editing drive info - admin user');
        this.editDriveControls();
        this.updateStatus = true;
        this.showStatus = true;
        this.isDisabled = false;
      } else if (this.drive.status === 'pending' || this.drive.status === 'verified' ||
        ((this.drive.status === 'in-progress' || this.drive.status === 'rejected') && this.database.current.user.is_commander)) {
        // view only
        console.log('viewing a drive');
        this.updateStatus = false;
        this.showStatus = true;
        this.isDisabled = true;
        this.viewDriveControls();
      } else if (this.drive.status === 'in-progress' && !this.database.current.user.is_commander) {
        // driver enter details to complete drive
        console.log('completing an in-progress drive - driver');
        this.updateStatus = false;
        this.isDisabled = false;
        this.showStatus = false;
        this.endDriveControls();
      } else if (this.drive.status === 'rejected' && !this.database.current.user.is_commander) {
        console.log('editing rejected drive info - driver');
        // driver edit details for rejected drive
        this.updateStatus = false;
        this.showStatus = true;
        this.isDisabled = false;
        this.editDriveControls();
      }
    }
  }

  viewDriveControls() {
    this.addDriveForm.disable();
    console.log('form is disabled? ' + this.isDisabled);
    console.log('update status? ' + this.updateStatus);
    this.setStartDriveDetails();
    this.setEndDriveDetails();
    this.setDriveStatusControls();

    // If commander and drive status is pending, add verified and reject controls
    if (this.database.current.user.is_commander && this.drive.status === 'pending') {
      console.log('commander needs to approve/reject drive');
      this.updateStatus = true;
      this.addDriveForm.get('driveStatus').setValidators(Validators.required);
      this.addDriveForm.get('radioVerify').enable();
      this.addDriveForm.get('radioReject').enable();
    }
  }

  startDriveControls() {
    this.addDriveForm.get('date').setValue(this.today);
    this.addDriveForm.get('startTime').setValue(this.today);
    this.addDriveForm.get('initEngineHr').setValue(this.today);
    // clear validators for end drive controls
    this.addDriveForm.get('endLocation').clearValidators();
    this.addDriveForm.get('endOdometer').clearValidators();
    this.addDriveForm.get('endTime').clearValidators();
    this.addDriveForm.get('fuelLevel').clearValidators();
    this.addDriveForm.get('finalEngineHr').clearValidators();
  }

  endDriveControls() {
    console.log('incomplete drive exist');
    this.setStartDriveDetails();
    // set endTime to current time
    const time2 = dayjs(new Date(this.today)).format('HH:mm');
    this.addDriveForm.get('endTime').setValue(time2);
    this.addDriveForm.get('finalEngineHr').setValue(time2);
  }

  editDriveControls() {
    this.addDriveForm.reset();
    this.setStartDriveDetails();
    this.setEndDriveDetails();
    this.setDriveStatusControls();
  }

  setStartDriveDetails() {
    // Stage-1 details: populate values of start drive fields
    this.addDriveForm.get('date').setValue(this.drive.date);
    this.addDriveForm.get('vehicleNumber').setValue(this.drive.vehicle);
    this.addDriveForm.get('vehicleType').setValue(this.drive.vehicle_type);
    this.addDriveForm.get('vehicleCommander').setValue(this.drive.commander);
    this.addDriveForm.get('startLocation').setValue(this.drive.start_location);
    this.addDriveForm.get('startOdometer').setValue(this.drive.start_odometer);
    this.addDriveForm.get('startTime').setValue(this.drive.start_time);
    console.log('start time: ' + this.addDriveForm.value.startTime);
    // Only for GSB
    this.addDriveForm.get('initEngineHr').setValue(this.drive.init_engine_hr);
  }

  setEndDriveDetails() {
    // Stage-2 details: populate values of end drive fields
    this.addDriveForm.get('endLocation').setValue(this.drive.end_location);
    this.addDriveForm.get('endOdometer').setValue(this.drive.end_odometer);
    this.addDriveForm.get('endTime').setValue(this.drive.end_time);
    console.log('end time: ' + this.addDriveForm.value.endTime);
    console.log('Fuel level (database): ' + parseInt(this.drive.fuelLevel));
    const fuel = this.drive.fuel_level;
    this.addDriveForm.get('fuelLevel').setValue(fuel);
    this.addDriveForm.get('driveComments').setValue(this.drive.comments);
    // Only for GSB
    this.addDriveForm.get('finalEngineHr').setValue(this.drive.final_engine_hr);
    // set the maintenance toggle to check
    this.isToggled = this.drive.is_maintenance;
  }

  setDriveStatusControls() {
    if (this.showStatus) {
      console.log('Original Drive Status: ', this.addDriveForm.get('driveStatus').value);
      this.addDriveForm.get('driveStatus').setValue(this.drive.status);
      console.log('Current Drive Status: ', this.addDriveForm.get('driveStatus').value);
    }
  }

  async addDrive(value) {
    console.log('is Commander: ' + this.database.current.user.is_commander);
    if (this.database.current.user.is_commander) {

      // Commander has verified/rejected drive, update drive status
      this.drive.status = this.addDriveForm.get('driveStatus').value;
      console.log('Drive status: ' + this.drive.status);

      // Update status in database
      await this.database.write('drive', this.drive.id, this.drive);
      this.errorMessage = '';
      this.successMessage = 'The drive status has been updated successfully.';
      this.showToast(this.successMessage);
      this.navCtrl.pop();
    } else
      if (this.database.current.drive_in_progress != null || this.drive != null) {

        // Submit is to complete the drive info
        console.log('Updating start and end drive details...');
        this.endDrive(value);
      } else {

        // Check currency of driver, e.g. JIT required
        var vehQuery = this.addDriveForm.value.vehicleType
        if (this.checkOperatorCurrencyInvalid(vehQuery, this.database.current.stats.most_recent_drive_by_vehicle_type[vehQuery]) && this.showJIT == false) {
          this.alertJIT(vehQuery);
        } else {
          try {
            const time = dayjs(new Date(this.addDriveForm.value.startTime)).format('HH:mm');
            const enginehr = dayjs(new Date(this.addDriveForm.value.initEngineHr)).format('HH:mm');
            if (this.addDriveForm.value.vehicleType === 'GSB') {
              var new_drive: Drive = {
                created: this.database.getTimeStamp(),
                rank: this.database.current.user.rank,
                name: this.database.current.user.name,
                driver: this.database.current.user.email,
                status: "in-progress",

                // Stage 1 details
                vehicle: this.addDriveForm.value.vehicleNumber,
                vehicle_type: this.addDriveForm.value.vehicleType,
                commander: this.addDriveForm.value.vehicleCommander,
                date: (this.addDriveForm.value.date).split('T')[0],
                start_location: this.addDriveForm.value.startLocation,
                start_odometer: parseInt(this.addDriveForm.value.startOdometer),
                start_time: time,
                // Only for GSB 
                init_engine_hr: enginehr
              };
            } else {
              var new_drive: Drive = {
                created: this.database.getTimeStamp(),
                rank: this.database.current.user.rank,
                name: this.database.current.user.name,
                driver: this.database.current.user.email,
                status: "in-progress",

                // Stage 1 details
                vehicle: this.addDriveForm.value.vehicleNumber,
                vehicle_type: this.addDriveForm.value.vehicleType,
                commander: this.addDriveForm.value.vehicleCommander,
                date: (this.addDriveForm.value.date).split('T')[0],
                start_location: this.addDriveForm.value.startLocation,
                start_odometer: parseInt(this.addDriveForm.value.startOdometer),
                start_time: time,
                // Only for GSB 
                init_engine_hr: '',
                //final_engine_hr: ''
              };
            }
            console.log(`new_drive = ${JSON.stringify(new_drive)}`);
            await this.database.add('drive', new_drive);
            this.errorMessage = '';
            this.successMessage = 'Your drive has been added successfully.';
            this.showToast(this.successMessage);
            this.navCtrl.pop();
          } catch (err) {
            this.errorMessage = `Add drive error: ${err}`;
            this.successMessage = '';
            this.showToast(this.errorMessage);
            this.navCtrl.pop();
          }
        }
      }
  }

  async endDrive(value) {
    // Added this check as end drive details can be saved despite missing info
    // Check if all mandatory fields are entered
    if (!this.addDriveForm.valid) {
      this.errorMessage = 'Drive cannot be updated. Missing End Drive information.';
      this.showToast(this.errorMessage);
      console.log(this.errorMessage);
      return;
    }
    try {
      const currentDrive = this.database.current.drive_history[0];

      // Stage 1 details: user may have made some changes to these info
      currentDrive.vehicle = this.addDriveForm.value.vehicleNumber;
      currentDrive.vehicle_type = this.addDriveForm.value.vehicleType;
      currentDrive.commander = this.addDriveForm.value.vehicleCommander;
      currentDrive.date = (this.addDriveForm.value.date).split('T')[0];
      currentDrive.start_location = this.addDriveForm.value.startLocation;
      currentDrive.start_odometer = parseInt(this.addDriveForm.value.startOdometer);
      currentDrive.start_time = this.addDriveForm.value.startTime;

      // Only for GSB
      if (this.addDriveForm.get('vehicleType').value === 'GSB') {
        currentDrive.init_engine_hr = this.addDriveForm.value.initEngineHr;
        currentDrive.final_engine_hr = this.addDriveForm.value.finalEngineHr;
      }

      // Stage 2 details
      currentDrive.end_location = this.addDriveForm.value.endLocation;
      currentDrive.end_odometer = parseInt(this.addDriveForm.value.endOdometer);
      currentDrive.end_time = this.addDriveForm.value.endTime;
      // Store maintenance toggle checked value in the drive doc
      currentDrive.is_maintenance = this.isToggled;
      currentDrive.fuel_level = parseInt(this.addDriveForm.value.fuelLevel);
      console.log('Fuel level (UI): ' + currentDrive.fuel_level);
      currentDrive.comments = this.addDriveForm.value.driveComments;
      currentDrive.status = 'pending';
      await this.database.write('drive', currentDrive.id, currentDrive);
      this.errorMessage = '';
      this.successMessage = 'Your drive has been updated.';
      this.showToast(this.successMessage);
      this.navCtrl.pop();
    } catch (err) {
      console.log(err);
      this.errorMessage = `Update drive error: ${err}`;
      this.successMessage = '';
      this.showToast(this.errorMessage);
      this.navCtrl.pop();
    }
  }

  showToast(msg) {
    this.toastController.create({
      message: msg,
      duration: 2000,
      position: 'middle'
    }).then(obj => {
      obj.present();
    });
  }

  onCancel() {
    this.navCtrl.pop();
  }

  onToggle() {
    if (this.isToggled) {
      this.isToggled = false;
    } else {
      this.isToggled = true;
    }
  }

  showSubmit() {
    if (this.updateStatus || !this.isDisabled) {
      return true;
    }
    return false;
  }

  public checkOperatorCurrencyInvalid(vehicletype: string, date: any) {
    const today = dayjs();
    var period = vehicletype === "M3G" ? 30 : 7;
    return today.diff(date, "day") > period;
  }

  async alertJIT(vehicle) {
    const alert = await this.alertCtrl.create({
      cssClass: 'my-custom-class',
      header: 'JIT Drills for ' + vehicle + ' required',
      subHeader: 'Please perform and complete the following JIT drills under the supervision of a vehicle commander.',
      message: 'Do you want to continue?',
      inputs: [
        {
          name: 'drive',
          id: 'drive',
          type: 'checkbox',
          label: '1km Drive',
          value: 'drive',
          checked: false
        },
        {
          name: 'park',
          id: 'park',
          type: 'checkbox',
          label: 'Parking Drills',
          value: 'park',
          checked: false
        },
        {
          name: 'reverse',
          id: 'reverse',
          type: 'checkbox',
          label: 'Reversing Drills',
          value: 'reverse',
          checked: false
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('JIT Cancelled. Navigating back to home.');
            this.navCtrl.back();
          }
        }, {
          text: 'Proceed',
          handler: data => {
            console.log(data);
            if (data.length == 3) {
              console.log('JIT acknowledged. Proceed to add drive.');
              this.showJIT = true;
            } else {
              console.log('JIT not acknowledged. Cannot proceed.');
              this.showToast('Ensure all JIT drills are done. Acknowledge by checking all fields.');
            }
          }
        }
      ]
    });
    await alert.present();
  }

}
