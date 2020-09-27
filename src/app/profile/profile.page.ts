import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../database.service';
import { AngularFireUploadTask, AngularFireStorage } from '@angular/fire/storage';
import { AngularFirestoreCollection, AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';

export interface MyData {
  name: string;
  filepath: string;
  size: number;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {

  task: AngularFireUploadTask;          // Upload task
  percentage: Observable<number>;       // Progress in percentage
  snapshot: Observable<any>;            // Snapshot of uploading file
  UploadedFileURL: Observable<string>;  // Uploaded File URL
  images: Observable<MyData[]>;         // Uploaded image list
  fileName: string;                     // File details
  fileSize: number;
  isUploading: boolean;                 // Status check
  isUploaded: boolean;
  
  private imageCollection: AngularFirestoreCollection<MyData>;

  constructor(
    public database:DatabaseService,
    private storage:AngularFireStorage,
    private db:AngularFirestore
  ) { 
    this.isUploading = false;
    this.isUploaded = false;
    
    // Set collection where images will save
    this.imageCollection = db.collection<MyData>('profilePhoto');
    this.images = this.imageCollection.valueChanges();
  }

  ngOnInit() {
  }

  uploadFile(event:FileList) {
    const file = event.item(0);   // The File object

    // Validation for images only
    if(file.type.split('/')[0] !== 'image') {
      console.log('Unsupported file type');
      return;
    }
    this.isUploading = true;
    this.isUploaded = false;
    this.fileName = file.name;

    const path = `profilePhoto/${this.database.current.user.fleet}_${this.database.current.user.email.split('@')[0]}_${this.database.current.user.name}`;   // The storage path
    const customMetadata = { app: 'Engineer Logbook Profile Photo Upload' };
    const fileRef = this.storage.ref(path);   // File reference
    this.task = this.storage.upload(path, file, {customMetadata});

    // Get file progress percentage
    this.percentage = this.task.percentageChanges();
    this.snapshot = this.task.snapshotChanges().pipe(
      finalize( () => {
        // Get uploaded file storage path
        this.UploadedFileURL = fileRef.getDownloadURL();
        this.UploadedFileURL.subscribe(resp => {
          this.updatePhoto(resp);
          this.isUploading = false;
          this.isUploaded = true;
        }, error => {
          console.error(error);
        });
      }), tap(snap => {
        this.fileSize = snap.totalBytes;
      })
    );
  }

  updatePhoto(url) {
    this.db.collection('user').doc(this.database.current.user.email).update({
      photoURL: url
    })
  }

}
