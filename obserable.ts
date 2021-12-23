'use strict'
import RxJS from 'rxjs';

type Observer<T> = {
    next: (val: T) => void;
    error: (error: any) => void;
    complete: () => void;
};
type IObservable = (observer: Observer<any>) => void;


class Observable<T> {
    _functionThatThrowsValues: IObservable;

    constructor(functionThatThrowsValues: IObservable) {
        this._functionThatThrowsValues = functionThatThrowsValues;
    }

    subscribe(
        observerOrNext: Observer<T> | Observer<T>['next'],
        error?: (e: any) => void,
        complete?: () => void
    ) {
        if (typeof observerOrNext === "function") {
            return this._functionThatThrowsValues({
                next: observerOrNext,
                error: error || (() => {}),
                complete: complete || (() => {}),
            });
        } else {
            // pass the observer object
            return this._functionThatThrowsValues(observerOrNext);
        }
    }

    map<V>(projectionFunction: (arg: T) => V) { 
        return new Observable<T>((observer) => {
            return this.subscribe({
                next(val) { observer.next(projectionFunction(val)) },
                error(e) { observer.error(e) } ,
                complete() { observer.complete() } 
            });
        });
    }

    mergeMap<V>(anotherFunctionThatThrowsValues: (arg: T) => Observable<V>) {
        return new Observable<T>((observer) => {
          return this.subscribe({
            next(val) {    
              anotherFunctionThatThrowsValues(val).subscribe({
                next(val) { observer.next(val) },
                error(e) { observer.error(e) } ,
                complete() { observer.complete() } 
              });
            },
            error(e) { observer.error(e) } ,
            complete() { observer.complete() } 
          });
        });
    }

    static fromEvent(element: HTMLElement, event: keyof WindowEventMap | string) {
        return new Observable((observer) => {
            const handler = (e: Event) => observer.next(e);
            element.addEventListener(event, handler); 
            
            return () => {
                element.removeEventListener(event, handler);
            };
        });
    }

    static fromArray<T>(array: Array<T>) {
        return new Observable(observer => {
            array.forEach(val => observer.next(val));
            observer.complete();
        });
    }

    static fromPromise<V extends any, T extends Promise<V>>(promise: T) {
        return new Observable((observer) => {
            promise
                .then(observer.next)
                .catch(observer.error)
                .then(observer.complete);
        });
    }

    static fromGenerator<Y>(generator: () => AsyncGenerator<Y, void, undefined> | Generator<Y, void, undefined>) {
        return new Observable(async (observer) => {
            try {
                for await (const val of generator()) {
                    observer.next(val);
                }
            } catch (e) {
                observer.error(e);
            } finally {
                observer.complete();
            }
        });
    }
}

const promise = new Promise((res) => setTimeout(() => res(22), 1000));
const fromPromise = Observable.fromPromise(promise);
fromPromise.subscribe((val) => console.log('fromPromise: ', val));
const generator = async function* () {
    let i = 0;
    while (true) {
        yield i++;
        await new Promise((res) => setTimeout(res, 500));
    }
}
const fromGenerator = Observable.fromGenerator(generator);
fromGenerator.subscribe((val) => console.log('fromGenerator: ', val));
