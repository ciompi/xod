import * as R from 'ramda';
import * as client from 'xod-client';
import { foldMaybe } from 'xod-func-tools';
import { INSTALL_ARDUINO_DEPENDENCIES_MSG } from './constants';
import { installArduinoDependencies } from './runners';
import { installDeps } from './actions';
import MSG from './messages';
import getLibraryNames from './getLibraryNames';

// TODO: Unify old-fashioned process with new `progressData`.
const progressToProcess = R.curry((processFn, progressData) => {
  processFn(progressData.note, progressData.percentage * 100);
});

export default store => next => action => {
  if (
    action.type === client.MESSAGE_BUTTON_CLICKED &&
    action.payload === INSTALL_ARDUINO_DEPENDENCIES_MSG
  ) {
    const state = store.getState();
    const maybeData = client.getMessageDataById(
      INSTALL_ARDUINO_DEPENDENCIES_MSG,
      state
    );

    foldMaybe(
      null,
      ({ libraries }) => {
        const proc = store.dispatch(installDeps());
        installArduinoDependencies(progressToProcess(proc.progress), {
          libraries,
        })
          .then(() => {
            store.dispatch(
              client.addNotification(
                // eslint-disable-next-line new-cap
                MSG.ARDUINO_LIBRARIES_INSTALLED({
                  libraryNames: getLibraryNames(libraries),
                })
              )
            );
            proc.success();
          })
          .catch(err => proc.fail(err.message, 0));
      },
      maybeData
    );
  }

  return next(action);
};
