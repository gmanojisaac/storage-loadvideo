// tslint:disable-next-line: max-line-length
import { Component, Directive, HostListener, EventEmitter, Output, ViewChild, Renderer2, ElementRef, AfterViewInit, OnInit, ChangeDetectorRef } from '@angular/core';
import { Observable, Subject, interval, fromEvent } from 'rxjs';
import { takeUntil, take, tap, pluck, map, filter } from 'rxjs/operators';
import { DomSanitizer } from '@angular/platform-browser';
import { BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import { PolicyService } from './policy.service';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';

export interface Videodata { itemlocation: string; }
export interface VideodataId extends Videodata { id: string;}

@Directive({
  selector: '[holdable]'
})
export class HoldableDirective {

  @Output() holdTime: EventEmitter<number> = new EventEmitter();
  @Output() stop = new EventEmitter();
  @Output() start = new EventEmitter();
  stop$ = new Subject<any>();

  constructor() {
    this.stop$.subscribe(() => {
      // this.holdTime.emit(0);
      this.stop.emit();
    });
  }

  @HostListener('mouseup')
  onExit() {
    console.log('detected up');
    this.stop$.next();
  }

  @HostListener('mousedown') 
  onHold() {
    console.log('detected mousedown');
    this.start.emit();
    const ms = 100;

    interval(ms).pipe(
      takeUntil(this.stop$),
      tap(v => {
        this.holdTime.emit(v * ms)
      }),
    )
    .subscribe();

  }
}

declare var MediaRecorder: any;
declare var Hammer: any;

export enum RecordingState {
  STOPPED = 'stopped',
  RECORDING = 'recording',
  FORBIDDEN = 'forbidden',
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ]
})
export class AppComponent implements AfterViewInit, OnInit {
  seconds: number;
  state: RecordingState = RecordingState.STOPPED;
  audioURLs = [];
  private mediaRecorder;
  private recordings$: Observable<any>;
  Screentype = '';
  eventText = '';
  indicators;
  @ViewChild('done', { static: true })
  public mybutton: ElementRef;
  @ViewChild('video', { static: false })
  public video: ElementRef;
  @ViewChild('recvideo', { static: false })
  public recvideo: ElementRef;
  stop$ = new Subject<any>();
  private recconstraints = {
    audio: true,
    video: { facingMode: { exact: 'user' } }
  };
  options: any;
  private videoCollection: AngularFirestoreCollection<Videodata>;
  myvideos: Observable<VideodataId[]>;
  authdata: any;
  private itemDoc: AngularFirestoreDocument<Videodata>;
  item: Observable<Videodata>;
  constructor(    
    private sanitizer: DomSanitizer,
    private changeDetector: ChangeDetectorRef,
    breakpointObserver: BreakpointObserver,
    private renderer: Renderer2,
    private _elementRef: ElementRef,
    public ps: PolicyService, 
    public afAuth: AngularFireAuth,
    private readonly afs: AngularFirestore) {
      breakpointObserver.observe([
        Breakpoints.Handset,
        Breakpoints.Tablet,
        Breakpoints.Web
      ]).subscribe(result => {        
        if(breakpointObserver.isMatched('(max-width: 599.99px)') && breakpointObserver.isMatched('(orientation: portrait)')){
          this.Screentype = 'Handset_Port';
        } else if(breakpointObserver.isMatched('(max-width: 959.99px)') && breakpointObserver.isMatched('(orientation: landscape)')){
          this.Screentype = 'Handset_Land';
        } else if(breakpointObserver.isMatched('(min-width: 600px)')  && breakpointObserver.isMatched('(max-width: 839.99px)') && breakpointObserver.isMatched('(orientation: portrait)') ){
          this.Screentype = 'Tablet_Port';
        } else if(breakpointObserver.isMatched('(min-width: 960px)')  && breakpointObserver.isMatched('(max-width: 1279.99px)') && breakpointObserver.isMatched('(orientation: landscape)') ){
          this.Screentype = 'Tablet_Land';
        } else if(breakpointObserver.isMatched('(min-width: 840px)') && breakpointObserver.isMatched('(orientation: portrait)')){
          this.Screentype = 'Web_Port';
        } else if(breakpointObserver.isMatched('(min-width: 1280px)') && breakpointObserver.isMatched('(orientation: landscape)') ){
          this.Screentype = 'Web_Land';
        }
      });
      this.authdata = this.afAuth.user.pipe(
        filter(user => user !== undefined),
        take(1)
      );
      //pick up the uid from auth
      this.authdata.subscribe(data =>{
        if(data !== null){
          this.itemDoc = afs.doc<Videodata>(`videodata/${data.uid}`);
          this.item = this.itemDoc.valueChanges();
        }
      });
      //else load from the collection 
      /*this.videoCollection = this.afs.collection<Videodata>('videodata');
      this.myvideos = this.videoCollection.snapshotChanges().pipe(
        map(actions => actions.map(a => {
          const data = a.payload.doc.data() as Videodata;
          const id = a.payload.doc.id;          
          return { id, ...data };
        }))
      );*/

  }
ngOnInit(){

}

clickme(){

}



  ngAfterViewInit(){

    if(this.Screentype === 'Handset_Port' || this.Screentype === 'Handset_Land'){
      let touchEventManager = new Hammer(this.mybutton.nativeElement, { inputClass: Hammer.TouchInput });
      touchEventManager.on('press', this.onPress.bind(this));
      touchEventManager.on('pressup', this.onPressUp.bind(this));
      touchEventManager.on('pan', this.onPressUp.bind(this));
    }
    navigator.mediaDevices.getUserMedia(this.recconstraints)
    .then(stream => {
      if (typeof MediaRecorder.isTypeSupported === 'function'){
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
          this.options = {mimeType: 'video/webm;codecs=vp9'}; //this one is supported in desktop
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
          this.options = {mimeType: 'video/webm;codecs=h264'};
        } else  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
          this.options = {mimeType: 'video/webm;codecs=vp8'};
        }
        this.mediaRecorder = new MediaRecorder(stream, this.options);
      }else{
        this.mediaRecorder = new MediaRecorder(stream);
      }
      const box = this._elementRef.nativeElement.querySelector('.myvideo');
      this.renderer.setProperty(box, 'volume', '0');   
      //this.video.nativeElement.srcObject = stream;//Only if a new user then start recording the stream -II
      this.recordings$ = fromEvent(this.mediaRecorder, 'dataavailable')
    }).catch(error => {
      console.log('CANNOT RECORD: ', error);
      this.state = RecordingState.FORBIDDEN;
    }); 
  }
  onPress(evt) {
    const ms = 100;
    this.state = RecordingState.RECORDING;
    this.mediaRecorder.start();
    this.recordings$.pipe(
      take(1),
      pluck('data'),
      tap((data: BlobPart) => {
        let blob = new Blob([data],  {
          type: 'video/webm'
        });
        this.video.nativeElement.srcObject.getTracks().forEach(track => {
          track.stop(); 
        });
        const box = this._elementRef.nativeElement.querySelector('.myrecvideo');
        this.ps.uploadVideo(blob);
        this.recvideo.nativeElement.src =  URL.createObjectURL(blob);
        this.renderer.setProperty(box, 'volume', '1.0');   

      })
    ).subscribe();
    interval(ms).pipe(
      takeUntil(this.stop$),
      tap(v => {
        this.seconds = Math.round((v * ms) / 1000);
      }),
    )
    .subscribe();
  }

  onPressUp(evt) {
    this.state = RecordingState.STOPPED;
    this.stop$.next();
    this.mediaRecorder.stop();
  }

  onStart() {    
    this.mediaRecorder.start();
    this.recordings$.pipe(
      take(1),
      pluck('data'),
      tap((data: BlobPart) => {
        let blob = new Blob([data],  {
          type: 'video/webm'
        });
        const box = this._elementRef.nativeElement.querySelector('.myrecvideo');
        this.ps.uploadVideo(blob);
        this.recvideo.nativeElement.src =  URL.createObjectURL(blob);
        this.renderer.setProperty(box, 'volume', '1.0');    
        this.video.nativeElement.srcObject.getTracks().forEach(track => {
          track.stop();
        });
      })
    ).subscribe();
  }

  onHold(time) {
    this.state = RecordingState.RECORDING;
    this.seconds = Math.round(time / 1000);
  }

  onStop() {
    this.state = RecordingState.STOPPED;
    this.mediaRecorder.stop();
  }
  login(){
    this.ps.login();
  }
  logout(){
    this.ps.logout();
  }
}
