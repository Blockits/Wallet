import ObjMultiplex from '@blockits/object-multiplex';
import pump from 'pump';

export function setupMultiplexer(connStream) {
  const mux = new ObjMultiplex();
  pump(
    connStream,
    mux,
    connStream,
    (err) => {
      if (err) {
        console.log(err);
      }
    }
  );
  return mux;
}
