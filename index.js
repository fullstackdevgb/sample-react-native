/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState, useRef} from 'react';
import {Image, StyleSheet, Text, View, Linking} from 'react-native';
import {MapComponent, ButtonSmall, ModalWhiteBg} from '../../components';
import {TouchableItem} from '../../elements';

import {
  APP_TOKEN,
  BookingStatus,
  DIMENSIONS,
  FONT_SIZE,
  SPACING,
  COLOR,
  TrackStatus,
  GOOGLE_PLACES_API_KEY,
} from '../../constants';
import style from '../../common/css/style';
import {navigateTo} from '../../helpers';
import {Routes} from '../../navigation/routes';
import {Container} from '../../elements';
import {ButtonExtraLarge} from '../../components';
import {getDistanceFromLatLonInM} from '../../common/calculateDistance';
import {useDispatch, useSelector} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAllRequest,
  updateTracks,
  updateUserLocation,
  getCurrentBooking,
} from '../../actions';
import {Marker} from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import moment from 'moment';

function PreviewRideScreen({navigation, route}) {
  const dispatch = useDispatch();
  const driver = useSelector((state) => state.location); //@ CURRENT LOCATION
  const notify = useSelector(
    (state) => state.driveRequest.notifyLocationChange,
  );
  //TODO: PICKUP LOCATION MAY GET UPDATED BASED ON SOCKET CALL
  const pickup = useSelector((state) => state.driveRequest.pickup); //@PICKUP LOCATION
  const rideDetails = useSelector(
    (state) => state.driveRequest.acceptRequest.data,
  );
  const bookingStatus = useSelector(
    (state) => state.getCurrentBookingStatus.booking.status,
  );

  const [loading, setLoading] = useState(false);
  const [displayMessage, showDisplayMessage] = useState(false);
  const [reachDisable, setReachDisable] = useState(false);

  useEffect(() => {
    const distance = getDistanceFromLatLonInM(
      driver.latitude,
      driver.longitude,
      pickup.latitude,
      pickup.longitude,
    );
    console.log({distance});
    if (bookingStatus === BookingStatus.GO_FOR_PICKUP && distance <= 100) {
      setReachDisable(false);
    } else if (
      bookingStatus === BookingStatus.GO_FOR_PICKUP &&
      distance > 100
    ) {
      setReachDisable(true);
    }
  }, [bookingStatus, driver, pickup]);

  function setModal(visible) {
    if (visible) {
      dispatch({type: 'LOCATION_NOTIFY'});
    } else {
      dispatch({type: 'LOCATION_NOTIFY_DISABLE'});
    }
  }

  useEffect(() => {
    async function f() {
      await AsyncStorage.setItem('BOOKING_ID', rideDetails.id.toString());
      dispatch(updateUserLocation(true));
    }
    f();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function acceptRide() {
    const token = await AsyncStorage.getItem(APP_TOKEN);
    if (bookingStatus === BookingStatus.GO_FOR_PICKUP) {
      setLoading(true);
      updateTracks(token, rideDetails.id, TrackStatus.REACHED_AT_PICKUP).then(
        async (res) => {
          if (res.success) {
            dispatch(getCurrentBooking(token));
            navigateTo(navigation, Routes.OnRoute, {}, true);
            setLoading(false);
          }
        },
      );
    } else {
      setLoading(true);
      updateTracks(token, rideDetails.id, BookingStatus.GO_FOR_PICKUP)
        .then(async (res) => {
          console.log('THIS IS RESPONSE ON GOING TO PICKUP', res);
          setLoading(false);
          if (
            res?.success ||
            res?.message === 'Already performed action on this request'
          ) {
            setReachDisable(true);
            showDisplayMessage(true);
            dispatch(getCurrentBooking(token));
            setTimeout(() => {
              showDisplayMessage(false);
            }, 3000);
            dispatch(getAllRequest(token));
          }
        })
        .catch((error) => {
          console.log('error from go for pickup now', error);
        });
    }
  }

  async function openGoogleMaps() {
    await Linking.openURL(
      'https://www.google.com/maps/dir/?api=1&travelmode=driving&dir_action=navigate&origin=' +
        driver.latitude +
        ',' +
        driver.longitude +
        '&destination=' +
        parseFloat(pickup.latitude) +
        ',' +
        parseFloat(pickup.longitude) +
        '&travelmode=driving',
    );
  }
  const sendBack = () => {
    navigation.navigate(Routes.Dashboard);
  };
  return (
    <Container>
      <ModalWhiteBg
        onBackdropPress={() => setModal(false)}
        setModalVisible={setModal}
        isVisible={notify}>
        <View
          style={{
            marginVertical: SPACING.v50,
            paddingBottom: SPACING.v25,
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Text
            style={{
              fontSize: FONT_SIZE.f25,
              color: COLOR.black,
              marginTop: SPACING.v30,
              fontFamily: 'Gibson',
            }}>
            MESSAGE
          </Text>
          <Text
            style={{
              fontSize: FONT_SIZE.f16,
              color: COLOR.blue,
            }}>
            Location is changed by Rider.
          </Text>
        </View>
      </ModalWhiteBg>
      <View style={style.flex_wrapper}>
        <MapComponent
          mapPadding={{top: 0, right: 0, bottom: 50, left: 0}}
          pickupChange={notify}
          markerTitles={['DRIVER', 'PICKUP']}
          mapStyle={{height: DIMENSIONS.SCREEN_HEIGHT / 1.4}}
          maxZoomLevel={30}
          minZoomLeve={20}
          showsUserLocation={false}>
          {driver.latitude != null && driver.longitude != null && (
            <Marker
              style={{justifyContent: 'center', alignItems: 'center'}}
              identifier={'DRIVER'}
              coordinate={{
                latitude: driver.latitude,
                longitude: driver.longitude,
              }}>
              <Image
                source={require('../../assets/png/pickup.png')}
                style={{
                  height: SPACING.v25,
                  width: SPACING.v25,
                  resizeMode: 'contain',
                }}
              />
              <Text>DRIVER</Text>
            </Marker>
          )}
          <Marker
            style={{justifyContent: 'center', alignItems: 'center'}}
            identifier={'PICKUP'}
            coordinate={{
              latitude: pickup.latitude,
              longitude: pickup.longitude,
            }}>
            <Image
              source={require('../../assets/png/destination.png')}
              style={{
                height: SPACING.v25,
                width: SPACING.v25,
                resizeMode: 'contain',
              }}
            />
            <Text>PICKUP</Text>
          </Marker>

          <MapViewDirections
            origin={{
              latitude: driver?.latitude,
              longitude: driver?.longitude,
            }}
            destination={{
              latitude: pickup.latitude,
              longitude: pickup.longitude,
            }}
            resetOnChange={false}
            strokeWidth={4}
            strokeColor={COLOR.greenDark}
            apikey={GOOGLE_PLACES_API_KEY}
            optimizeWaypoints={true} // Billing?
            timePrecision={'now'}
          />
        </MapComponent>
        {displayMessage && route.params.screenName !== 'driveRequest' && (
          <View style={style.black_background}>
            <Text style={{color: 'white'}}>
              {bookingStatus === BookingStatus.GO_FOR_PICKUP
                ? "Press the REACH AT SOURCE when you have reached at Rider's location"
                : "You have accepted the ride. Now press the GO FOR PICKUP location and drive through to Rider's location"}
            </Text>
          </View>
        )}
        {route.params.screenName === 'driveRequest' && (
          <TouchableItem onPress={sendBack} style={styles.mapCancelBtn}>
            <Image
              source={require('../../assets/png/cancel-1.png')}
              style={styles.mapCancelIcon}
            />
          </TouchableItem>
        )}
        {route.params.screenName !== 'driveRequest' && (
          <ButtonSmall
            style={{
              position: 'absolute',
              top: SPACING.v70,
              left: SPACING.v20,
            }}
            onPress={openGoogleMaps}
            title={'Start Navigation'}
          />
        )}
      </View>
      <View>
        <View style={style.commonMapOverlayTextWrapper}>
          <View style={styles.rideDetailsWrapper}>
            <View style={styles.userRideImageWrapper}>
              <Image
                source={require('../../assets/png/user-profile.png')}
                style={styles.pickupUserProfilePicture}
              />
            </View>
            <View style={styles.rideUserDetailsWrapper}>
              <Text style={styles.commonRideText}>
                PickUp: {rideDetails.pickupAddress}
              </Text>
              <Text style={styles.commonRideText}>
                Booking Date : {rideDetails.bookingDate}
              </Text>
              <View style={styles.linkTextWrapper}>
                <Text style={styles.commonRideText}>
                  Booking Time :
                  {moment
                    .utc(rideDetails.bookingTime, 'HH:mm:ss')
                    .local()
                    .format('HH:mm:ss')}
                </Text>
              </View>
              {rideDetails.status !== BookingStatus.PENDING && (
                <ButtonExtraLarge
                  style={[styles.buttonAlignLeft]}
                  imageStyle={{
                    opacity: reachDisable ? 0.3 : 1,
                  }}
                  title={
                    bookingStatus === BookingStatus.GO_FOR_PICKUP
                      ? 'REACH AT SOURCE'
                      : 'GO TO PICKUP'
                  }
                  buttonText={{
                    opacity: reachDisable ? 0.3 : 1,
                  }}
                  disable={reachDisable}
                  onPress={acceptRide}
                  isLoading={loading}
                  opacity={0.8}
                />
              )}
            </View>
          </View>

          {/*begin trip section start here*/}
          {/* <View style={styles.driverToPassengerDistanceWrapper}> */}
          {/*<View style={styles.driveLocationWrapper}>*/}
          {/*    <Text style={styles.driveLocationText}>From: <Text style={styles.driveLocationTextGreen}>172 Someset Road, New York, NY</Text></Text>*/}
          {/*    <Image source={require('../../assets/png/map-1.png')} style={styles.mapIcon} />*/}
          {/*</View>*/}
          {/*<View style={styles.driverToPassengerDetails}>*/}
          {/*    <View style={styles.commonLeftRightCol}>*/}
          {/*        <Text style={styles.commonLeftRightColText}>Tom Beaker{"\n"}8 min drive</Text>*/}
          {/*    </View>*/}
          {/*    <View style={styles.driverIconWrapper}>*/}
          {/*        <Image source={require('../../assets/png/user-profile.png')} style={styles.driverIcon} />*/}
          {/*    </View>*/}
          {/*    <View style={styles.commonLeftRightCol}>*/}
          {/*        <Text style={styles.commonLeftRightColText}>Passenger{"\n"}2 mi. away</Text>*/}
          {/*    </View>*/}
          {/*</View>*/}
          {/*<ButtonExtraLarge title={'start ride'} style={styles.beginTripBtn} onPress={() => navigateTo(navigation, Routes.OnRoute)*/}
          {/*}*/}
          {/*             opacity={0.8}*/}
          {/*/>*/}
          {/* </View> */}
          {/* <ModalWhiteBg
            onBackdropPress={() => setModalVisible(false)}
            setModalVisible={setModalVisible}
            isVisible={visible}>
            <View style={styles.cancelRideModalWrapper}>
              <Text style={styles.cancelRideTitle}>Cancel Ride</Text>
              <View style={styles.selectCancelRideWrapper}>
                <View style={styles.commonCancelRiderWrapper}>
                  <Text style={styles.cancelRideCommonTitle}>Plan Changed</Text>
                  <TouchableItem
                    style={styles.radioBtnWrapper}
                    onPress={() => setCancelRide('planChanged')}>
                    {cancelRide === 'planChanged' && (
                      <View style={styles.radioBtnChecked} />
                    )}
                  </TouchableItem>
                </View>
                <View style={styles.commonCancelRiderWrapper}>
                  <Text style={styles.cancelRideCommonTitle}>
                    Booked another Cab
                  </Text>
                  <TouchableItem
                    style={styles.radioBtnWrapper}
                    onPress={() => setCancelRide('bookedAnotherCab')}>
                    {cancelRide === 'bookedAnotherCab' && (
                      <View style={styles.radioBtnChecked} />
                    )}
                  </TouchableItem>
                </View>
                <View style={styles.commonCancelRiderWrapper}>
                  <Text style={styles.cancelRideCommonTitle}>
                    My reason is not listed
                  </Text>
                  <TouchableItem
                    style={styles.radioBtnWrapper}
                    onPress={() => setCancelRide('reasonNotListed')}>
                    {cancelRide === 'reasonNotListed' && (
                      <View style={styles.radioBtnChecked} />
                    )}
                  </TouchableItem>
                </View>
                <View style={styles.commonCancelRiderWrapper}>
                  <Text style={styles.cancelRideCommonTitle}>Other</Text>
                  <TouchableItem
                    style={styles.radioBtnWrapper}
                    onPress={() => setCancelRide('other')}>
                    {cancelRide === 'other' && (
                      <View style={styles.radioBtnChecked} />
                    )}
                  </TouchableItem>
                </View>
                {cancelRide === 'other' && (
                  <View style={{paddingHorizontal: SPACING.v20}}>
                    <TextInput
                      placeholder={'Write Something'}
                      multiline={true}
                      value={cancelReason}
                      onChangeText={setCancelReason}
                      style={{
                        width: '100%',
                        marginVertical: SPACING.v10,
                        textAlignVertical: 'top',
                        height: SPACING.v100,
                        borderWidth: 1,
                        borderRadius: SPACING.v5,
                      }}
                    />
                  </View>
                )}
                <ButtonMedium
                  title={cancelReason || cancelRide ? 'cancel' : "don't cancel"}
                  onPress={cancelUserRide}
                  isLoading={cancelLoading}
                />
              </View>
            </View>
          </ModalWhiteBg> */}
          {/*begin trip section end here*/}
        </View>
      </View>
    </Container>
  );
}
const styles = StyleSheet.create({
  LocalPpmWrapper: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: DIMENSIONS.WINDOW_WIDTH / 1.5,
    alignSelf: 'center',
    marginTop: SPACING.v20,
    padding: SPACING.v10,
    borderRadius: 5,
  },
  localPpmText: {
    fontSize: FONT_SIZE.f15,
    color: COLOR.green,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Gibson',
  },
  pickupLocationWrapper: {
    backgroundColor: COLOR.secondary,
    paddingVertical: SPACING.v25,
    paddingLeft: SPACING.h25,
    paddingRight: SPACING.h3,
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    borderRadius: 5,
    marginTop: SPACING.v60,
  },
  pickupUserPictureWrapper: {
    width: DIMENSIONS.WINDOW_WIDTH / 5,
    // backgroundColor: 'red',
  },
  pickupUserPicture: {
    width: DIMENSIONS.WINDOW_WIDTH / 6,
    height: DIMENSIONS.WINDOW_WIDTH / 6,
    borderRadius: 40,
  },
  pickupLocationAddress: {
    width: DIMENSIONS.WINDOW_WIDTH / 1.72,
    // backgroundColor: 'green',
  },
  commonPickupLocationText: {
    color: COLOR.white,
    fontSize: FONT_SIZE.f11,
    fontFamily: 'Gibson',
    marginBottom: SPACING.v3,
  },
  labelText: {
    fontSize: FONT_SIZE.f13,
    fontFamily: 'Gibson-SemiBold',
  },

  rideDetailsWrapper: {
    backgroundColor: COLOR.secondary,
    position: 'absolute',
    width: '100%',
    bottom: 0,
    paddingHorizontal: SPACING.h20,
    paddingVertical: SPACING.v25,
    paddingBottom: SPACING.v30,
    flexDirection: 'row',
  },
  userRideImageWrapper: {
    width: DIMENSIONS.WINDOW_WIDTH / 7,
    // backgroundColor: 'red',
  },
  pickupUserProfilePicture: {
    width: DIMENSIONS.WINDOW_WIDTH / 7.5,
    // height: DIMENSIONS.WINDOW_WIDTH / 7.5,
    height: DIMENSIONS.WINDOW_WIDTH / 7,
    borderColor: COLOR.white,
    borderWidth: 2,
    borderRadius: 5,
  },
  rideUserDetailsWrapper: {
    width: DIMENSIONS.WINDOW_WIDTH / 1.33,
    // backgroundColor: 'green',
    flexDirection: 'column',
    paddingLeft: SPACING.h10,
  },
  commonRideText: {
    color: COLOR.white,
    fontSize: FONT_SIZE.f14,
    fontFamily: 'Gibson',
    textTransform: 'capitalize',
  },
  linkTextWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.v25,
  },
  linkRatingWrapper: {
    flexDirection: 'row',
  },
  starIcon: {
    width: DIMENSIONS.WINDOW_WIDTH / 40,
    height: DIMENSIONS.WINDOW_WIDTH / 40,
    marginLeft: SPACING.h3,
  },
  buttonAlignLeft: {
    alignSelf: 'flex-start',
    width: '90%',
    marginLeft: -SPACING.h10,
    marginTop: -SPACING.v5,
  },
  driverToPassengerDistanceWrapper: {
    backgroundColor: COLOR.secondary,
    position: 'absolute',
    width: '100%',
    bottom: 0,
    flexDirection: 'column',
  },
  driverToPassengerDetails: {
    borderColor: COLOR.white,
    borderWidth: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 3,
    alignItems: 'center',
    backgroundColor: '#49494b',
    height: DIMENSIONS.WINDOW_WIDTH / 5.2,
    marginHorizontal: SPACING.h10,
    marginVertical: SPACING.v25,
    marginBottom: SPACING.v40,
  },
  commonLeftRightColText: {
    color: COLOR.white,
    textAlign: 'center',
    fontFamily: 'Gibson',
  },
  commonLeftRightCol: {
    width: DIMENSIONS.WINDOW_WIDTH / 2.67,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverIconWrapper: {
    width: DIMENSIONS.WINDOW_WIDTH / 5.5,
    height: '104%',
    // backgroundColor: 'green',
    marginTop: '-1%',
  },
  driverIcon: {
    width: '100%',
    height: '100%',
    borderColor: COLOR.white,
    borderWidth: 2,
    borderRadius: 5,
  },
  beginTripBtn: {
    marginBottom: SPACING.v40,
  },
  flex_center: {
    flex: 1,
    justifyContent: 'center',
  },

  driveLocationWrapper: {
    backgroundColor: '#f5f6fa',
    marginBottom: DIMENSIONS.WINDOW_HEIGHT / 80,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.v15,
    paddingVertical: SPACING.v15,
    justifyContent: 'space-between',
  },
  driveLocationText: {
    color: COLOR.secondary,
    fontSize: FONT_SIZE.f14,
    fontFamily: 'Gibson',
  },
  driveLocationTextGreen: {
    color: COLOR.greenDark,
    fontSize: FONT_SIZE.f13,
  },
  mapIcon: {
    width: DIMENSIONS.WINDOW_WIDTH / 13,
    height: DIMENSIONS.WINDOW_WIDTH / 13,
    marginRight: SPACING.h10,
  },
  cancelRideModalWrapper: {
    flexDirection: 'column',
  },
  cancelRideTitle: {
    fontSize: FONT_SIZE.f18,
    alignSelf: 'center',
    paddingVertical: SPACING.v20,
    borderBottomWidth: 1,
    borderColor: COLOR.grey,
    width: '100%',
    textAlign: 'center',
    fontFamily: 'Gibson',
  },
  selectCancelRideWrapper: {
    flexDirection: 'column',
    paddingTop: SPACING.v15,
    paddingBottom: SPACING.v40,
  },
  commonCancelRiderWrapper: {
    paddingBottom: SPACING.v30,
    paddingHorizontal: SPACING.h25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelRideCommonTitle: {
    fontSize: FONT_SIZE.f18,
    fontFamily: 'Gibson',
  },
  radioBtnWrapper: {
    borderWidth: 1,
    borderColor: COLOR.primary,
    width: DIMENSIONS.WINDOW_WIDTH / 20,
    height: DIMENSIONS.WINDOW_WIDTH / 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioBtnChecked: {
    width: DIMENSIONS.WINDOW_WIDTH / 32,
    height: DIMENSIONS.WINDOW_WIDTH / 32,
    borderRadius: 16,
    backgroundColor: COLOR.primary,
  },

  userRiderImage: {
    width: DIMENSIONS.WINDOW_WIDTH / 4,
    height: DIMENSIONS.WINDOW_WIDTH / 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  rideImage: {
    width: '100%',
    height: '100%',
    marginBottom: SPACING.v5,
    borderRadius: 6,
  },
  messageBtnWrapper: {
    position: 'absolute',
    bottom: -SPACING.v1,
    backgroundColor: COLOR.primary,
    left: 0,
    right: 0,
    borderRadius: 3,
  },
  messageBtnText: {
    color: COLOR.white,
    fontSize: FONT_SIZE.f12,
    alignSelf: 'center',
    paddingVertical: SPACING.v3,
    fontFamily: 'Gibson',
  },
  userRiderAddress: {
    color: COLOR.green,
    textAlign: 'center',
    paddingVertical: SPACING.v10,
    lineHeight: 18,
    fontFamily: 'Gibson',
  },
  commonInnerBrownBg: {
    backgroundColor: COLOR.brown,
    paddingTop: SPACING.v10,
    paddingBottom: SPACING.v20,
    paddingHorizontal: SPACING.h20,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.32,
    shadowRadius: 8,
    elevation: 5,
    width: '100%',
  },
  userRideTime: {
    color: COLOR.white,
    fontSize: FONT_SIZE.f12,
    alignSelf: 'flex-end',
    fontFamily: 'Gibson',
    marginBottom: SPACING.v5,
  },
  buttonTextStyle: {
    fontSize: FONT_SIZE.f13,
    fontFamily: 'Gibson',
    paddingTop: SPACING.v15,
  },
  newRideRequestWrapper: {
    flexDirection: 'column',
    width: '100%',
    backgroundColor: COLOR.brown,
    borderRadius: 6,
  },
  commonRideRequestHeader: {
    backgroundColor: COLOR.green,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    paddingVertical: SPACING.v10,
  },
  mapCancelBtn: {
    width: DIMENSIONS.WINDOW_WIDTH / 12,
    height: DIMENSIONS.WINDOW_WIDTH / 12,
    backgroundColor: COLOR.black,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: SPACING.h20,
    top: SPACING.v45,
    zIndex: 999,
  },
  mapCancelIcon: {
    width: '70%',
    height: '70%',
  },
  newRideImage: {
    width: DIMENSIONS.WINDOW_WIDTH / 5,
    height: DIMENSIONS.WINDOW_WIDTH / 5,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLOR.white,
    marginBottom: SPACING.v5,
  },
  newRideBodyBrownBg: {
    paddingTop: SPACING.v15,
    paddingBottom: SPACING.v10,
    paddingHorizontal: SPACING.h30,
    flexDirection: 'column',
  },
  inlineLocationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.v15,
  },
  blockLocationWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
    marginVertical: SPACING.v30,
  },
  leftIcon: {
    width: DIMENSIONS.WINDOW_WIDTH / 23,
    height: DIMENSIONS.WINDOW_WIDTH / 23,
    borderColor: COLOR.black,
    borderWidth: 3,
    borderRadius: DIMENSIONS.WINDOW_WIDTH / 15,
    marginRight: SPACING.h10,
    backgroundColor: COLOR.white,
  },
  leftIcon2: {
    width: DIMENSIONS.WINDOW_WIDTH / 23,
    height: DIMENSIONS.WINDOW_WIDTH / 23,
    backgroundColor: COLOR.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.h10,
  },
  leftIconInner: {
    width: DIMENSIONS.WINDOW_WIDTH / 40,
    height: DIMENSIONS.WINDOW_WIDTH / 40,
    borderRadius: DIMENSIONS.WINDOW_WIDTH / 15,
    backgroundColor: COLOR.white,
  },
  NewRideLocationNameGreen: {
    fontSize: FONT_SIZE.f15,
    color: COLOR.green,
    lineHeight: 20,
  },
  passengerOfLocation: {
    fontSize: FONT_SIZE.f16,
    color: COLOR.green,
    lineHeight: 20,
    alignSelf: 'center',
    textAlign: 'center',
    fontFamily: 'Gibson',
  },
  NewRideLocationName: {
    fontSize: FONT_SIZE.f15,
    color: COLOR.white,
  },
  newRequestLabel: {
    fontSize: FONT_SIZE.f12,
    color: COLOR.white,
    fontFamily: 'Gibson',
  },
  newRequestUserName: {
    fontSize: FONT_SIZE.f15,
    color: COLOR.white,
    fontFamily: 'Gibson',
  },
});

export default PreviewRideScreen;

// const [cancelLoading, setCancelLoading] = useState(false);
// const [cancelReason, setCancelReason] = useState('');
// async function cancelRidePress() {
//   setModalVisible(true);
// }

// const [cancelRide, setCancelRide] = useState('');
// const [visible, setVisible] = React.useState(false);
// function setModalVisible(visibleFlag) {
//   setVisible(visibleFlag);
// }

// async function requestApiHit() {
//   const token = await AsyncStorage.getItem(APP_TOKEN);
//   setCancelLoading(true);
//   requestAccept(token, rideDetails.id, BookingStatus.CANCELLED).then(
//     async (res) => {
//       setCancelLoading(false);
//       if (res.success) {
//         SnackbarPopup(res.message, 'Ok');
//         dispatch(getAllRequest(token));
//         setModalVisible(false);
//         navigateTo(navigation, Routes.DriveRequests);
//         setCancelRide('');
//         setCancelReason('');
//       } else {
//         SnackbarPopup(res.message, 'Ok');
//         setModalVisible(false);
//         dispatch(getAllRequest(token));
//         setCancelRide('');
//         setCancelReason('');
//       }
//     },
//   );
// }

// async function cancelUserRide() {
//   if (!cancelRide) {
//     setModalVisible(false);
//     setCancelRide('');
//   } else if (cancelRide !== 'other') {
//     await requestApiHit();
//   } else if (cancelRide === 'other' && !cancelReason) {
//     SnackbarPopup('Cancel reason is required', 'Ok');
//   } else if (cancelRide === 'other' && cancelReason) {
//     await requestApiHit();
//   } else {
//     setModalVisible(false);
//     setCancelRide('');
//   }
// }

// export function mapStateToProps(state) {
//   return {
//     driveRequests: state.driveRequest.driveRequests,
//     error: state.driveRequest.error,
//     loading: state.driveRequest.loading,
//   };
// }
