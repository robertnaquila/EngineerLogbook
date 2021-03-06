import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import * as firebase from 'firebase/app';
import * as dayjs from 'dayjs';
import { sprintf } from 'sprintf-js';

export interface Summary {
  drive_count: number;
  mileage_km: number; 
  duration_minutes: number; 
  most_recent_drive: any;   // dayjs type
  most_recent_drive_by_vehicle_type: any;
  mileage_by_vehicle_type: any;
}

export interface User {
  created: string;
  last_login?: string;
  photoURL?: string;
  rank: string;
  name: string;
  email: string;  // identifier
  fleet: string;
  company: string;
  is_admin?: boolean;  // Superuser
  is_commander?: boolean;

  // For drivers only
  is_driver?: boolean;
  license_num?: string;
  license_type?: string;
  
  summary?: Summary;  // Commander page needs this...
}

export interface Drive {
  created: string;
  id?: string;  // random identifier created by Firestore
  status: string;  // valid values: 'in-progress', 'pending', 'verified', 'rejected'

  // Stage-1 details (Start journey)
  rank: string;
  name: string;
  driver: string;
  commander: string;
  vehicle: string;
  vehicle_type: string;  // TODO: to retrieve from Vehicle table?
  date: string;          // date format is YYYY-MM-DD for sorting purposes
  start_time: string;    // time format is hh:mm in 24-hour format
  start_location: string;
  start_odometer: number;
  // For GSB only
  init_engine_hr?: string;
  final_engine_hr?: string;

  // Stage-2 details (End journey)
  end_time?: string;
  end_location?: string;
  end_odometer?: number;
  fuel_level?: number;  // valid values: 0(empty), 1, 2, 3, 4(full)
  is_maintenance?: boolean;
  comments?: string;
}

export interface Login {
  user: User;
  drive_history?: Drive[];  // All drives relevant to current driver or commander

  all_users?: User[];   // All users of the same company as logged in user
  
  // For drivers only
  all_commanders_of_driver?: User[];   // For Driver: All commanders of the same company as driver (required for drop-down list for add-drive)

  // For commanders only
  all_drivers_of_commander?: User[];  // For Commander: All operators of the same company as commander (required for commander's page)

  // For both drivers and commanders
  stats?: Summary;

  // Interfacing with UI
  drive_in_progress?: Drive;
  drive_to_edit?: Drive;
  
  // For Firestore data binding/un-binding
  detach_bind_drive?: any;
  detach_bind_user?: any;
  snapshot_wait: number;
}

export const VehicleTypes: string[] = [
  'M3G', 
  'JEEP', 
  'MSS', 
  'PLANT',
  '5TON', 
  'OUV', 
  'GSB',
  'OBM'
];

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  public current: Login = null;  // Currently logged in user

  constructor(public firestore: AngularFirestore) { 
    this.current = this.createDebugLogin();
  }
  
  ///////////////////////////////////////////////////////////////////////////////////
  // Retrieves and populates profile/drive fields for the currently logged in user.
  // This is called right after Firebase authentication is successful.
  ///////////////////////////////////////////////////////////////////////////////////
  public async init(email: string) {
    if(this.current) this.logout();
    const result: any = await this.read('user', email);
    this.current = {
      user: result.data() as User,
      snapshot_wait: 0
    }

    await this.log(`Logged-in: ${email}`);
    if(!this.current.user.fleet) {
      // No fleet string? Set it to the default and update the database
      this.current.user.fleet = "35SCE";
      await this.write('user', email, this.current.user);
    }

    // Bind local data to database
    this.bind(this.current);

    // Wait for data binding to finish
    while(this.current.snapshot_wait==0) {
      console.log("> Still retrieving user data...");
      await this.sleep(500);
    }

    console.log(`> Current database user: ${email} => ${JSON.stringify(this.current.user)}`);

    // Get all users who are in the same unit and company as logged in user
    // WARNING: old version of app uses "fleet" instead "unit". Error may occur if app is not updated to latest version.
    this.current.all_users = await this.list('user', ['fleet','==',this.current.user.fleet,'company','==',this.current.user.company]);

    // If user is_driver, get list of commanders from the same company (for drop-down list in add-drive)
    if(this.current.user.is_driver) {
      this.current.all_commanders_of_driver = this.current.all_users.filter( (user) => { return user.is_commander && !user.is_admin; });  // Don't include superuser in commanders list
      console.log(`> List of commanders[${this.current.all_commanders_of_driver.length}] = ${JSON.stringify(this.current.all_commanders_of_driver)}`);
    }
    // If user is_commander, get list of drivers from the same company
    if(this.current.user.is_commander) {
      this.current.all_drivers_of_commander = this.current.all_users.filter( (user) => { return user.is_driver; });
      console.log(`> List of drivers[${this.current.all_drivers_of_commander.length}] = ${JSON.stringify(this.current.all_drivers_of_commander)}`);

      // Also retrieve summaries of drivers
      for(let driver of this.current.all_drivers_of_commander) {
        const result: any = await this.read('summary', driver.email);

        if(result.data()) {
          // Found summary, great
          driver.summary = result.data() as Summary;
        } else {
          // No summary? Calculate it...
          driver.summary = this.summarize(this.current.drive_history.filter( (drive) => { return drive.driver === driver.email }));
        }
      }
    }
    return this.current;
  }

  private sleep(ms) {
    return new Promise(resolve => {setTimeout(resolve,ms)});
  }

  ///////////////////////////////////////////////////////////////////////////////////
  // Unbinds real-time data bindings and nullify this.current.
  ///////////////////////////////////////////////////////////////////////////////////
  public logout(): void {
    if(!this.current) return;

    this.log(`Log-out: ${this.current.user.email}`);

    // Unsubscribe to real-time data binding
    // See https://firebase.google.com/docs/firestore/query-data/listen
    if(this.current.detach_bind_user) {
      this.current.detach_bind_user();
      this.current.detach_bind_user = null;
    }
    if(this.current.detach_bind_drive) {
      this.current.detach_bind_drive();
      this.current.detach_bind_drive = null;
    }
    this.current = null;
  }

  ///////////////////////////////////////////////////////////////////////////////////
  // Basic CRUD operators
  ///////////////////////////////////////////////////////////////////////////////////
  public collection(table:string) {
    return firebase.firestore().collection(table);
  }

  public async read(table:string, key:string) {
    return await this.collection(table).doc(key).get();
  }

  public async write(table:string, key: string, doc:any) {
    await this.log(`Write table:${table} key:${key}`);
    return await this.collection(table).doc(key).set(doc);
  }

  public async add(table:string, doc:any) {
    await this.log(`Write table:${table}`);
    return await this.collection(table).add(doc);  //add() creates a new random doc key
  }

  public async delete(table:string, key:string) {
    await this.log(`Delete table:${table} key:${key}`);
    return await this.collection(table).doc(key).delete();
  }

  public async list(table:string, condition?:any, order_by?: any) {
    let query:any = firebase.firestore().collection(table);
    if(condition) {
      // Augment query with optional condition
      //query = query.where(condition[0], condition[1], condition[2]);
      query = query.where(condition[0], condition[1], condition[2]).where(condition[3], condition[4], condition[5]);
    }
    if(order_by) {
      // Augment query with sorted order
      order_by.forEach( (order) => {
        query = query.orderBy(order); // Not yet tested 
      });
    }

    const snapshot = await query.get();
    const array:Array<any> = [];
    snapshot.forEach( (doc) => {
      array.push(doc.data()); // Caller will access docs with "doc.id" and "doc.data()"
    });
    return array;
  }

  public async log(message:string) {
    const now = dayjs();
    var user:string = this.current && this.current.user.email != "sample@gmail.com" ? `,${this.current.user.email}` : '';
    var key:string = `${now.format('YYYY-MM-DD, HH:mm:ss')}${user}`;

    console.log(`> ${message}`);

    return await this.collection('logger').doc(key).set( {message:message} ); 
  }

  ///////////////////////////////////////////////////////////////////////////////////
  // Aggregates mileage and durations in drive history array.
  // Track most recent drive and calculate operator currency.
  ///////////////////////////////////////////////////////////////////////////////////
  private summarize(drive_history:Drive[]): Summary {
    const stats:Summary = {
      drive_count: 0,
      mileage_km: 0,
      duration_minutes: 0,
      most_recent_drive: dayjs(0),
      most_recent_drive_by_vehicle_type: {},
      mileage_by_vehicle_type: {}
    }

    for(let i=0; i<drive_history.length; i++) {
      let trip = drive_history[i];

      if(trip.status === 'in-progress') {
        console.log(`[${i}] ${trip.date} *** Drive-In-Progress *** ${trip.id}`);
        continue;
      }

      let distance = this.distance(trip);
      let duration = this.duration(trip);

      stats.drive_count++;
      stats.mileage_km += distance;
      stats.duration_minutes += duration;

      // Update mileage per vehicle type
      if(stats.mileage_by_vehicle_type[trip.vehicle_type]) stats.mileage_by_vehicle_type[trip.vehicle_type] += distance;
      else stats.mileage_by_vehicle_type[trip.vehicle_type] = distance;

      // Update operator currency for each vehicle class
      let start_dt = dayjs(trip.date + " " + trip.start_time, 'YYYY-MM-DD HH:mm');

      if(!stats.most_recent_drive.unix() || stats.most_recent_drive.isBefore(start_dt)) {
        stats.most_recent_drive = start_dt;
      }
      if(!stats.most_recent_drive_by_vehicle_type[trip.vehicle_type] || stats.most_recent_drive_by_vehicle_type[trip.vehicle_type].isBefore(start_dt)) {
        stats.most_recent_drive_by_vehicle_type[trip.vehicle_type] = start_dt;
      }
    }
    console.log(`> Summary: mileage=${stats.mileage_km} duration=${stats.duration_minutes} drives=${drive_history.length} recent=${stats.most_recent_drive}`);
    console.log(`> Recent drives by VehicleType: ${JSON.stringify(stats.most_recent_drive_by_vehicle_type)}`);
    console.log(`> Mileage by VehicleType: ${JSON.stringify(stats.mileage_by_vehicle_type)}`);

    return stats;      
  }

  ///////////////////////////////////////////////////////////////////////////////////
  // Real-time data binding. This is automatically called right after any 
  // CRUD operation on the current user's drive history or profile.
  ///////////////////////////////////////////////////////////////////////////////////
  private bind(login:Login): void {
    // For both drivers and commanders
    login.detach_bind_user = this.collection('user').doc(login.user.email).onSnapshot( (doc) => {
      login.user = doc.data() as User; // Casting to interface User
      console.log("\n> Updated Login object:", login.user);
    });

    // Construct composite query depending on driver or commander (require Firestore composite index)
    var query = this.collection("drive").orderBy("date","desc").orderBy("start_time","desc");

    query = login.user.is_admin ? query : login.user.is_commander ? query.where("commander","==",login.user.email) : query.where("driver","==",login.user.email);

    login.detach_bind_drive = query.onSnapshot( (querySnapshot) => {
      login.drive_history = [];
      login.drive_in_progress = null;
      querySnapshot.forEach( (doc) => {
        let trip:Drive = doc.data() as Drive; // Casting to interface Drive
        trip.id = doc.id;
        login.drive_history.push(trip);
        if(trip.end_time == null) login.drive_in_progress = trip;
      });
      console.log(`\n> Updated drive history for ${login.user.email}, ${login.drive_history.length} drives found.`);
      
      // Calculate new stats for both drivers and commanders
      login.stats = this.summarize(login.drive_history);

      // For drivers, write summarized report to database (For commanders' module)
      if(login.user.is_driver) {
        this.write("summary",login.user.email,JSON.parse(JSON.stringify(login.stats)));
      }

      // Allow login to proceed...
      login.snapshot_wait++;
    });
  }  

  ///////////////////////////////////////////////////////////////////////////////////
  // Utilities
  ///////////////////////////////////////////////////////////////////////////////////
  public duration(trip:Drive):number {
    if(!trip.end_odometer || trip.status==='in-progress') return 0; // Handle drive-in-progress
    
    const dayjs_format = 'YYYY-MM-DD HH:mm';
    let start_dt = dayjs(trip.date + " " + trip.start_time, dayjs_format);
    let end_dt = dayjs(trip.date + " " + trip.end_time, dayjs_format);
    let diff = end_dt.diff(start_dt,"minute");
    
    if(diff < 0) diff += 60*24; // roll-over to next day
    
    return diff;
  }

  public distance(trip:Drive): number {
    if(!trip.end_odometer || trip.status==='in-progress') return 0; // Handle drive-in-progress
    return trip.end_odometer - trip.start_odometer;
  }

  public formatMinutesToString(minutes:number) {
    let result:string = "";
    let show_hours = true, show_minutes = true;
    let days = Math.floor(minutes/24/60);

    if(days > 30) {
      const months = Math.floor(days/30);
      days = days%30;
      result += months + " months ";
      show_hours = show_minutes = false;
    }

    if(days >= 1) {
      result += days + " days ";
      show_minutes = false;
    }

    if(show_hours && show_minutes) {
      result += sprintf("%02d:%02d",Math.floor(minutes/60%24),minutes%60);
    } else {
      if(show_hours) {
        result += Math.floor(minutes/60%24) + " hours ";
      }
      if(show_minutes) {
        result += minutes%60 + " mins ";
      }
    }
    return result;
  }

  public getTimeStamp():string {
    return dayjs(new Date()).format('YYYY-MM-DD HH:mm');
  }

  ///////////////////////////////////////////////////////////////////////////////////
  // Test data
  ///////////////////////////////////////////////////////////////////////////////////
  private createDebugLogin():Login {
    const drive_history:Drive[] = [
      {
        created: '',
        rank: 'PTE',
        name: 'driver_name',
        driver: 'driver_email',
        commander: 'commander_name',
        vehicle: '1234MID',
        vehicle_type: '5TON',
        date: '10 Aug 2019',
        start_time: '1300',
        start_location: 'NSC',
        start_odometer: 100000,
        status: 'in-progress'
      },
      {
        created: '',
        rank: 'PTE',
        name: 'driver_name',
        driver: 'driver_email',
        commander: 'commander_name',
        vehicle: '1235MID',
        vehicle_type: 'MSS',
        date: '12 Aug 2019',
        start_time: '1500',
        end_time: '1824',
        start_location: 'JC2',
        end_location: 'AMK',
        start_odometer: 200000,
        end_odometer: 200037,
        status: 'pending',
        fuel_level: 2,
        comments: 'AOC'
      },
      {
        created: '',
        rank: 'PTE',
        name: 'driver_name',
        driver: 'driver_email',
        commander: 'commander_name',
        vehicle: '1235MID',
        vehicle_type: 'M3G',
        date: '12 Sep 2019',
        start_time: '1400',
        end_time: '1800',
        start_location: 'Seletar Camp',
        end_location: 'Seletar Camp',
        start_odometer: 100000,
        end_odometer: 100005,
        status: 'verified',
        fuel_level: 3,
        is_maintenance: true,
        comments: 'BOC'
      }
    ];

    const user:User = {
      created: '',
      photoURL: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png',
      rank: "REC",
      name: "Sample User",
      fleet: "Sample Unit",
      email: "sample@gmail.com",
      is_driver: true,
      company: 'B'
    };
    
    return {
      user: user,
      drive_history: drive_history,
      snapshot_wait: 1,
      stats: this.summarize(drive_history)
    };
  }
}
