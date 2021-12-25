import { distinctUntilChanged, switchMap, timer } from 'rxjs';
import axios from 'axios';

const getValue = async () => {
    const res = await axios.get('https://google.com');
    const body = res.data.substring(0, 100);
    return body;
}
const observable = timer(0, 1000)
    .pipe(
        switchMap(getValue),
        distinctUntilChanged(),
    )

const subscription = observable.subscribe((val) => console.log(val));

setTimeout(() => {
    subscription.unsubscribe();
}, 5000);
