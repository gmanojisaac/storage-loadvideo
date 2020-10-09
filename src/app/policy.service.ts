import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';
import { AngularFirestore, AngularFirestoreCollection,AngularFirestoreDocument } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from 'firebase/app';
export interface Item { itemlocation: string; }

@Injectable({
  providedIn: 'root'
})
export class PolicyService {
  uploadPercent: Observable<number>;
  downloadURL: Observable<string>;
  userid: string;
  private itemsCollection: AngularFirestoreCollection<Item>;
  item: Observable<Item>;
  constructor(
    private storage: AngularFireStorage, 
    private afs: AngularFirestore, 
    public readonly auth: AngularFireAuth) {
      this.itemsCollection = afs.collection<Item>('videodata');
   }
  updateItem(item: Item) {
    this.userid = firebase.auth().currentUser.uid;
    this.afs.doc(`videodata/${this.userid}`)
    .update(item);
  }
  setItem() {
    this.userid = firebase.auth().currentUser.uid;
    this.afs.doc(`videodata/${this.userid}`)
    .set({itemlocation: ''});
  }
  
  uploadVideo(consvideo: Blob){
    this.userid = firebase.auth().currentUser.uid;
    const filePath = `${this.userid}/video`;
    const fileRef = this.storage.ref(filePath);
    const task = fileRef.put(consvideo);
    this.uploadPercent = task.percentageChanges();
    task.snapshotChanges().pipe(
      finalize(() => {
        this.downloadURL = fileRef.getDownloadURL();
        fileRef.getDownloadURL().toPromise().then( (url) => {
          if(url !== null){
            this.updateItem({itemlocation: url});
          }
        })
      })
    ).subscribe();
  }
  login() {
    this.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).then(_=>{
    this.setItem();//only if a new user--I
    });
  }
  logout() {
    this.auth.signOut();
  }


}
