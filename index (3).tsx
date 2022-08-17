import React from 'react';
import AIHeader from '@allintest/components/Header';
import AIButton from '@allintest/components/AIButton';
import navigateTo from '@allintest/navigation/navigate';
import { useAppDispatch, useAppSelector } from '@allintest/redux/hooks';
import i18n from '@allintest/language';
import color from '@allintest/theme/color';
import LinearGradient from 'react-native-linear-gradient';
import {
  Image,
  Pressable,
  Text,
  FlatList,
  ListRenderItem,
  View,
} from 'react-native';
import dropDownIcon from '@allintest/assets/images/png/arrow-dropdown.png';
import logoImage from '@allintest/assets/images/png/logo2x.png';
import AIModal from '@allintest/components/Modal';
import { removeUserSession } from '@allintest/common/encryptedStorage';
import {
  addRegionInRedux,
  addSchoolCodeInRedux,
  addSchoolNameInRedux,
  removeTokenFromRedux,
} from '@allintest/redux/reducers/userInfo';
import { showMessage } from 'react-native-flash-message';
import { SUCCESS, TOKEN } from '@allintest/constants/common';
import { LOGIN, WELCOME } from '@allintest/constants/navigation';
import {
  clearQuestions,
  getSchoolsFromDatabase,
  initialiseRealm,
} from '@allintest/database';
import { startForegroundService } from '@allintest/common/forgroundService';
import { useNetInfo } from '@react-native-community/netinfo';
import { JWT_SECRET } from '@allintest/constants/api';
import { decode } from 'react-native-pure-jwt';
import { height } from '@allintest/helpers/dimensions';
import DeviceInfo from 'react-native-device-info';
import styleSheet, { MainWrapper, VersionNumber } from './styled';
import {
  ModalBody,
  ConfirmText,
  LogoutBtnsWrapper,
} from '../LearningAssessments/styled';
import { IProps, typeSchool } from './interface';

const version = DeviceInfo.getVersion();
const SchoolSelect = ({ route }: IProps) => {
  const language = useAppSelector(state => state.language.value);
  const [dropDown, toggleDropDown] = React.useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = React.useState(false);
  const [schoolCode, setSchoolCode] = React.useState('');
  const [schools, setSchool] = React.useState<typeSchool[]>([]);
  const dispatch = useAppDispatch();
  const token = useAppSelector(state => state.user.token);
  const netInfo = useNetInfo();

  React.useEffect(() => {
    if (netInfo.isConnected) startForegroundService(token);
  }, [netInfo.isConnected, token]);

  React.useEffect(() => {
    if (token !== null)
      decode(token, JWT_SECRET)
        .then((decoded: any) => {
          setSchool(
            decoded.payload.schoolCode.map((schoolObject: typeSchool) => ({
              schoolCode: schoolObject.schoolCode,
              schoolName: schoolObject.schoolName,
              woreda: schoolObject.woreda,
              zone: schoolObject.zone,
              region: schoolObject.region,
            })),
          );
        })
        .catch(err => console.log(err));
  }, [language, token]);

  React.useEffect(() => {
    const openRealm = async () => {
      if (!route.params.sync) {
        await initialiseRealm();
        setSchool(getSchoolsFromDatabase());
      }
    };
    openRealm();
  }, [route.params.sync]);
  const handleLogoutPress = async () => {
    if (token !== null) {
      removeUserSession(TOKEN)
        .then(status => {
          if (status) {
            showMessage({
              message: 'Log out Successfull',
              type: SUCCESS,
            });
            dispatch(removeTokenFromRedux());
            clearQuestions();
            setLogoutModalVisible(false);
            navigateTo(LOGIN, {}, true);
          }
        })
        .catch(err => console.log('this error is from logout button', err));
    }
  };

  const renderItem: ListRenderItem<typeSchool> = ({ item }) => (
    <Pressable
      style={({ pressed }) => [
        styleSheet.listItemPressable,
        {
          backgroundColor: pressed ? color.yellow : color.transparent,
        },
      ]}
      onPress={() => {
        toggleDropDown(prev => !prev);
        setSchoolCode(item.schoolName);
        dispatch(addSchoolCodeInRedux(item.schoolCode));
        dispatch(addSchoolNameInRedux(item.schoolName));
        dispatch(
          addRegionInRedux({
            woreda: item.woreda,
            zone: item.zone,
            region: item.region,
          }),
        );

        navigateTo(WELCOME, {
          sync: route.params.sync,
        });
      }}>
      <Text style={styleSheet.listItemText}>{item.schoolName}</Text>
    </Pressable>
  );
  return (
    <>
      <AIHeader
        title={i18n.t('global-translations.Welcome', { locale: language })}
        toggleLanguage
        logout={netInfo.isConnected}
        onPressLogout={() => setLogoutModalVisible(true)}
      />
      <MainWrapper>
        <Image style={styleSheet.logoImage} source={logoImage} />
        <Text style={styleSheet.headlineText}>
          {i18n.t('school-screen.welcome-message', {
            locale: language,
          })}
        </Text>
        <View style={styleSheet.dropdownWrapper}>
          <Pressable
            style={styleSheet.dropdown}
            onPress={() => toggleDropDown(prev => !prev)}>
            <Text style={styleSheet.dropdownText}>
              {`${i18n.t('global-translations.school', {
                locale: language,
              })} ${schoolCode}`}
            </Text>
            <Image
              style={[
                styleSheet.dropdownIcon,
                dropDown && { transform: [{ rotate: '180deg' }] },
              ]}
              source={dropDownIcon}
            />
          </Pressable>
        </View>
        {dropDown && (
          <FlatList
            showsVerticalScrollIndicator={schools.length > 1}
            showsHorizontalScrollIndicator={false}
            style={[
              styleSheet.flatlistView,
              { height: schools.length > 1 ? height.h300 : height.h55 },
            ]}
            data={schools}
            renderItem={renderItem}
            keyExtractor={item => item.schoolCode}
          />
        )}
        <View
          style={{
            alignSelf: 'center',
            flex: 1,
            justifyContent: 'flex-end',
          }}>
          <VersionNumber>{`v${version}`}</VersionNumber>
        </View>
      </MainWrapper>

      <AIModal
        isVisible={logoutModalVisible}
        closeModal={() => setLogoutModalVisible(false)}
        modalTitle={i18n.t('welcome-screen.logout-text', {
          locale: language,
        })}
        logoutModal>
        <ModalBody>
          <ConfirmText>
            {i18n.t('welcome-screen.logout-popup-message', {
              locale: language,
            })}
          </ConfirmText>
          <LogoutBtnsWrapper>
            <LinearGradient
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              colors={[color.secondary, color.primary]}
              style={styleSheet.LinearGradient}>
              <AIButton
                text={i18n.t('global-translations.cancel', {
                  locale: language,
                })}
                onPress={() => setLogoutModalVisible(false)}
              />
            </LinearGradient>
            <LinearGradient
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              colors={[color.red.light, color.red.dark]}
              style={styleSheet.LinearGradient}>
              <AIButton
                text={i18n.t('welcome-screen.button-text-logout', {
                  locale: language,
                })}
                onPress={handleLogoutPress}
              />
            </LinearGradient>
          </LogoutBtnsWrapper>
        </ModalBody>
      </AIModal>
    </>
  );
};

export default SchoolSelect;
