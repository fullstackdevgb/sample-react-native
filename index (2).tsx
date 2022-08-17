/* eslint-disable no-nested-ternary */
import React, { useState, useRef, FC } from 'react';
import AIHeader from '@allintest/components/Header';
import AIModal from '@allintest/components/Modal';
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AIButton from '@allintest/components/AIButton';
import navigateTo from '@allintest/navigation/navigate';
import { useAppSelector, useAppDispatch } from '@allintest/redux/hooks';
import { pushData } from '@allintest/redux/reducers/ResponseArrayReducer';
import color from '@allintest/theme/color';
import LinearGradient from 'react-native-linear-gradient';
import { updateTestResults } from '@allintest/database';
import { INCOMPLETE_TEST, WELCOME } from '@allintest/constants/navigation';
import i18n from '@allintest/language';
import TimerClock from '@allintest/components/Timer';
import { WARNING } from '@allintest/constants/common';
import { showMessage } from 'react-native-flash-message';
import { height, spacing, width } from '@allintest/helpers/dimensions';
import { fontFamily, fontSize } from '@allintest/theme/fonts';
import { Picker } from '@react-native-picker/picker';
import { useNetInfo } from '@react-native-community/netinfo';
import { startForegroundService } from '@allintest/common/forgroundService';
import QuestionHashIcon from '@allintest/assets/images/svg/QuestionHashIcon';
import YesPressed from '@allintest/assets/images/svg/YesPressed';
import TimerIcon from '@allintest/assets/images/svg/TimerIcon';
import DontKnow from '@allintest/assets/images/svg/DontKnow';
import No from '@allintest/assets/images/svg/No';
import Yes from '@allintest/assets/images/svg/Yes';
import Listening from '@allintest/assets/images/svg/Listening';
import Reading from '@allintest/assets/images/svg/Reading';
import Writing from '@allintest/assets/images/svg/Writing';
import Speaking from '@allintest/assets/images/svg/Speaking';
import { IProps, StateObject } from './interface';
import styleSheet, {
  QABackgroundImage,
  QAButtonWrapper,
  QAButtonText,
  ModalBody,
  ConfirmText,
  LogoutBtnsWrapper,
  QAButtonWrapperMain,
  InstructionWrapper,
  QuestionHashWrapper,
  QuestionWrapper,
  CorrectAnswerWrapper,
  StopRuleWrapper,
} from './styled';

const T: FC = ({ children }) => (
  <Text style={{ textDecorationLine: 'underline' }}>{children}</Text>
);
const U = (text: string) => React.createElement(T, null, text);

const QuestionAndAnswer = ({ navigation }: IProps) => {
  const scrollRef = useRef<any>(null);
  const [statesObject, setStateObject] = useState<StateObject>({
    answer: null,
    backScreenModal: false,
    nextQuestion: false,
  });
  const netInfo = useNetInfo();
  const [revealed, revealAnswer] = useState(false);
  const [instruction, showInstruction] = useState(false);
  const [iterate, setIteration] = useState(0);
  const dispatch = useAppDispatch();
  const token = useAppSelector(state => state.user.token);
  const [stopRuleScreen, setStopRuleScreen] = useState(true);
  const language = useAppSelector(state => state.language.value);
  const magnification = useAppSelector(state => state.language.magnification);
  const questions = useAppSelector(state => state.questionsArray);
  const responseArray = useAppSelector(state => state.answers.responseArray);
  const [gender, setGender] = useState('Select');
  const [time, setTime] = useState('');
  const [stop, setStop] = useState(false);
  console.log(questions);
  React.useEffect(() => {
    setStateObject(prev => ({ ...prev, answer: null }));
    revealAnswer(false);
    setStop(false);
  }, [iterate]);
  const optionList = [
    {
      option:
        questions.questionsArray[iterate][
          `item${i18n.t('global-translations.language', {
            locale: language,
          })}Line1`
        ],
      id: 'A',
    },
    {
      option:
        questions.questionsArray[iterate][
          `item${i18n.t('global-translations.language', {
            locale: language,
          })}Line2`
        ],
      id: 'B',
    },
    {
      option:
        questions.questionsArray[iterate][
          `item${i18n.t('global-translations.language', {
            locale: language,
          })}Line3`
        ],
      id: 'C',
    },
    {
      option:
        questions.questionsArray[iterate][
          `item${i18n.t('global-translations.language', {
            locale: language,
          })}Line4`
        ],
      id: 'D',
    },
    {
      option:
        questions.questionsArray[iterate][
          `item${i18n.t('global-translations.language', {
            locale: language,
          })}Line5`
        ],
      id: 'E',
    },
    {
      option:
        questions.questionsArray[iterate][
          `item${i18n.t('global-translations.language', {
            locale: language,
          })}Line6`
        ],
      id: 'F',
    },
  ];
  const registerAnswer = (response: any) => {
    const questionResponse = {
      id: `${questions.questionsArray[iterate].moduleCode}_${questions.questionsArray[iterate].questionHash}`,
      response,
      time: time.replace(/(\r\n|\n|\r)/gm, ''),
      level: questions.questionsArray[iterate].itemLevel,
      competencies: questions.questionsArray[iterate].competenciesEnglish,
    };
    dispatch(pushData(questionResponse));
  };
  React.useEffect(() => {
    navigation.addListener(
      'beforeRemove',
      (e: { preventDefault: () => void; data: { action: any } }) => {
        if (e.data.action.type === 'GO_BACK') {
          e.preventDefault();
        }
      },
    );
  }, [navigation]);
  const Competencyicon: { [key: string]: any } = {
    Listening: <Listening color={stopRuleScreen ? color.primary : 'white'} />,
    Reading: <Reading color={stopRuleScreen ? color.primary : 'white'} />,
    Writing: <Writing color={stopRuleScreen ? color.primary : 'white'} />,
    Speaking: <Speaking color={stopRuleScreen ? color.primary : 'white'} />,
  };
  return (
    <>
      <AIHeader
        qa
        smallQA
        toggleLanguage
        toggleMagnification
        backFunction={() => {
          Alert.alert(
            i18n.t('test-screen.discard-changes', {
              locale: language,
            }),
            i18n.t('test-screen.confirm-discard', {
              locale: language,
            }),
            [
              { text: "Don't leave", style: 'cancel', onPress: () => {} },
              {
                text: 'Discard',
                style: 'destructive',
                onPress: () => navigateTo(WELCOME, {}),
              },
            ],
          );
        }}
        title={
          stopRuleScreen
            ? gender === 'Select'
              ? ' '
              : i18n.t('test-screen.question-overview', {
                  locale: language,
                })
            : questions.questionsArray[iterate][
                `taskTitle${i18n.t('global-translations.language', {
                  locale: language,
                })}`
              ]
        }
        logout={false}
        backButton
      />
      <QABackgroundImage ref={scrollRef}>
        {gender === 'Select' ? (
          iterate === 0 && (
            <View style={{ padding: 40 }}>
              <Text
                style={{
                  fontFamily: fontFamily.JosefinSansMeduim,
                  fontSize: fontSize.f20 * magnification,
                  color: color.primary,
                  margin: 5,
                }}>
                {i18n.t('test-screen.gender', {
                  locale: language,
                })}
              </Text>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: color.yellow,
                  borderRadius: 5,
                  elevation: 5,
                  backgroundColor: color.white,
                  marginBottom: 20,
                }}>
                <Picker
                  mode="dropdown"
                  selectedValue={gender}
                  onValueChange={itemValue => setGender(itemValue)}>
                  <Picker.Item
                    label={i18n.t('test-screen.select', {
                      locale: language,
                    })}
                    value="Select"
                  />
                  <Picker.Item
                    label={i18n.t('test-screen.male', {
                      locale: language,
                    })}
                    value="Male"
                  />
                  <Picker.Item
                    label={i18n.t('test-screen.female', {
                      locale: language,
                    })}
                    value="Female"
                  />
                </Picker>
              </View>
            </View>
          )
        ) : (
          <>
            <InstructionWrapper
              style={{
                paddingTop: 0,
                elevation: stopRuleScreen ? 10 : 0,
                backgroundColor: stopRuleScreen ? '#1750ae' : '#00000000',
              }}>
              <View
                style={{
                  justifyContent: 'space-between',
                  flexDirection: 'row',
                }}>
                <QuestionHashWrapper
                  style={{
                    backgroundColor: stopRuleScreen ? '#f9d14d' : '#1750ae',
                  }}>
                  <Text
                    style={{
                      fontSize: fontSize.f15 * magnification,
                      fontFamily: fontFamily.JosefinSansMeduim,
                      paddingHorizontal: 10,
                      color: stopRuleScreen ? color.primary : 'white',
                    }}>
                    {questions.questionsArray[iterate].questionHash.replace(
                      'Q',
                      i18n.t('global-translations.Q', {
                        locale: language,
                      }),
                    )}
                  </Text>
                  {stopRuleScreen && <QuestionHashIcon />}
                </QuestionHashWrapper>

                <QuestionHashWrapper
                  style={{
                    backgroundColor: stopRuleScreen ? '#f9d14d' : '#1750ae',
                  }}>
                  {
                    Competencyicon[
                      questions.questionsArray[iterate].competenciesEnglish
                    ]
                  }
                </QuestionHashWrapper>
              </View>

              {stopRuleScreen && (
                <>
                  <Text
                    style={{
                      paddingTop: 0,
                      textAlign: 'center',
                      fontSize: fontSize.f16 * magnification,
                      color: '#F9D14D',
                      fontFamily: fontFamily.JosefinSansMeduim,
                    }}>
                    {i18n.t('test-screen.instruction', {
                      locale: language,
                    })}
                    :
                  </Text>
                  <Text
                    style={{
                      marginTop: stopRuleScreen ? 0 : 0,
                      textAlign: 'center',
                      paddingHorizontal: 0,
                      paddingTop: 0,
                      fontSize: fontSize.f12 * magnification,
                      color: stopRuleScreen ? 'white' : 'black',
                      fontFamily: fontFamily.DMSansRegular,
                    }}>
                    {
                      questions.questionsArray[iterate][
                        `assessorSaysContent${i18n.t(
                          'global-translations.language',
                          {
                            locale: language,
                          },
                        )}`
                      ]
                    }
                  </Text>
                </>
              )}
              {/* Show Hide instructions */}
              {!stopRuleScreen &&
                (!instruction ? (
                  <TouchableOpacity
                    onPress={() => {
                      showInstruction(!instruction);
                    }}
                    style={{
                      alignSelf: 'center',
                      width: 245,
                      borderRadius: 35,
                      borderWidth: 1,
                      borderColor: '#A5A5A5',
                      justifyContent: 'center',
                      marginTop: 20,
                      height: 45,
                    }}>
                    <QAButtonText
                      style={{
                        color: '#A5A5A5',
                        fontSize: (fontSize.f24 * magnification) / 2,
                        textAlign: 'center',
                        textAlignVertical: 'center',
                      }}>
                      {i18n.t('test-screen.reveal-instructions', {
                        locale: language,
                      })}
                    </QAButtonText>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      showInstruction(!instruction);
                    }}>
                    <Text
                      style={{
                        marginTop: stopRuleScreen ? 0 : 2,
                        textAlign: 'left',
                        paddingHorizontal: 25,
                        paddingTop: 45,
                        fontSize: fontSize.f10 * magnification,
                        color: stopRuleScreen ? 'white' : 'black',
                        fontFamily: fontFamily.DMSansBold,
                        fontWeight: 'bold',
                      }}>
                      {
                        questions.questionsArray[iterate][
                          `assessorSaysContent${i18n.t(
                            'global-translations.language',
                            {
                              locale: language,
                            },
                          )}`
                        ]
                      }
                    </Text>
                  </TouchableOpacity>
                ))}
            </InstructionWrapper>

            {stopRuleScreen ? (
              <Text
                style={{
                  margin: 10,
                  fontSize: fontSize.f18 * magnification,
                  fontFamily: fontFamily.JosefinSansMeduim,
                  paddingHorizontal: 10,
                  color: stopRuleScreen ? color.black : '#707070',
                  textAlign: 'center',
                }}>
                {i18n.t('test-screen.stimulus', {
                  locale: language,
                })}
              </Text>
            ) : (
              questions.questionsArray[iterate][
                `comprehensionTextContent${i18n.t(
                  'global-translations.language',
                  {
                    locale: language,
                  },
                )}`
              ] != null && (
                <Text
                  style={{
                    margin: 8,
                    lineHeight: 24,
                    fontSize: fontSize.f10 * magnification,
                    fontFamily: fontFamily.DMSansRegular,
                    paddingHorizontal: 52,
                    color: stopRuleScreen ? color.black : '#707070',
                    textAlign: 'left',
                  }}>
                  {questions.questionsArray[iterate][
                    `comprehensionTextContent${i18n.t(
                      'global-translations.language',
                      {
                        locale: language,
                      },
                    )}`
                  ]
                    .split('/*/')
                    .map((element: string) => {
                      if (/U\('[^']*'\)/i.test(element)) {
                        return U(element.replace("U('", '').replace("')", ''));
                      }
                      return element;
                    })}
                </Text>
              )
            )}

            {questions.questionsArray[iterate][
              `questionItem${i18n.t('global-translations.language', {
                locale: language,
              })}`
            ] != null && (
              <QuestionWrapper style={{ width: `${30 * magnification}%` }}>
                <View
                  style={{
                    backgroundColor: 'white',
                    margin: 2,
                    borderBottomLeftRadius: 8.5,
                    borderTopRightRadius: 8.5,
                  }}>
                  <Text
                    style={{
                      flex: 1,
                      backgroundColor: '#1750AE',
                      paddingHorizontal: 15,
                      paddingVertical: 5,
                      borderTopRightRadius: 8,
                      fontSize: fontSize.f15 * magnification,
                      color: 'white',
                    }}>
                    {i18n.t('test-screen.question', {
                      locale: language,
                    })}
                  </Text>
                  <Text
                    style={{
                      margin: 2,
                      fontSize: fontSize.f20 * magnification,
                      fontFamily: fontFamily.JosefinSansMeduim,
                      color: color.primary,
                      textAlign: 'center',
                      borderBottomLeftRadius: 8,
                      padding: 10 * magnification,
                    }}>
                    {questions.questionsArray[iterate][
                      `questionItem${i18n.t('global-translations.language', {
                        locale: language,
                      })}`
                    ]
                      .split('/*/')
                      .map((element: string) => {
                        if (/U\('[^']*'\)/i.test(element)) {
                          return U(
                            element.replace("U('", '').replace("')", ''),
                          );
                        }
                        return element;
                      })}
                  </Text>
                  <View
                    style={{
                      flexWrap: 'wrap',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 5,
                    }}>
                    {optionList.map(optionObject => {
                      if (optionObject.option != null) {
                        if (!optionObject.option.includes('base64,')) {
                          return (
                            <Text
                              style={{
                                fontSize: fontSize.f12 * magnification,
                                fontFamily: fontFamily.JosefinSansMeduim,
                                margin: 5 * magnification,
                                color: 'black',
                              }}>
                              {optionObject.option}
                            </Text>
                          );
                        }
                      }
                      return null;
                    })}
                  </View>
                </View>
              </QuestionWrapper>
            )}
            {!stopRuleScreen && (
              <View
                style={{
                  flexWrap: 'wrap',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {optionList.map(optionObject => {
                  if (optionObject.option != null) {
                    if (optionObject.option.includes('base64,')) {
                      return (
                        <View
                          key={optionObject.option}
                          style={{ alignItems: 'center' }}>
                          {optionList.filter(obj => obj.option !== null)
                            .length > 1 && (
                            <Text
                              style={{
                                fontFamily: fontFamily.JosefinSansMeduim,
                                margin: 5,
                                fontSize: fontSize.f20 * magnification,
                                color: color.primary,
                              }}>
                              {optionObject.id}
                            </Text>
                          )}
                          <Image
                            source={{ uri: optionObject.option }}
                            style={{
                              width: width.w100 * magnification,
                              height: height.h100 * magnification,
                              resizeMode: 'contain',
                              margin: spacing.v5,
                            }}
                          />
                        </View>
                      );
                    }
                  }

                  return null;
                })}
              </View>
            )}
            <CorrectAnswerWrapper
              style={{
                justifyContent: stopRuleScreen ? 'center' : 'space-between',
                flexWrap: stopRuleScreen ? 'wrap' : 'nowrap',
              }}>
              {stopRuleScreen ? (
                <>
                  <YesPressed small />
                  <Text
                    style={{
                      fontSize: fontSize.f12 * magnification,
                      fontFamily: fontFamily.JosefinSansMeduim,
                      color: '#707070',
                      textAlign: 'center',
                      padding: 5 * magnification,
                    }}>
                    {i18n.t('test-screen.correct-answer', {
                      locale: language,
                    })}
                    :{' '}
                  </Text>
                  <Text
                    style={{
                      fontSize: fontSize.f12 * magnification,
                      fontFamily: fontFamily.JosefinSansMeduim,
                      color: '#000000',
                      textAlign: 'center',
                      padding: 5 * magnification,
                    }}>
                    {questions.questionsArray[iterate][
                      `correctItem${i18n.t('global-translations.language', {
                        locale: language,
                      })}`
                    ]
                      .split('/*/')
                      .map((element: string) => {
                        if (/U\('[^']*'\)/i.test(element)) {
                          return U(
                            element.replace("U('", '').replace("')", ''),
                          );
                        }
                        return element;
                      })}
                  </Text>
                </>
              ) : (
                <View
                  style={{
                    flexDirection: 'row',
                    alignSelf: 'center',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 5,
                  }}>
                  <Yes
                    pressed={statesObject.answer === 'Yes'}
                    onPress={() => {
                      setStop(true);

                      setStateObject(prev => ({
                        ...prev,
                        answer: 'Yes',
                      }));
                    }}
                  />
                  <No
                    pressed={statesObject.answer === 'No'}
                    onPress={() => {
                      setStop(true);
                      setStateObject(prev => ({
                        ...prev,
                        answer: 'No',
                      }));
                    }}
                  />
                  <DontKnow
                    pressed={statesObject.answer === `Don't know`}
                    onPress={() => {
                      setStop(true);
                      setStateObject(prev => ({
                        ...prev,
                        answer: `Don't know`,
                      }));
                    }}
                  />
                </View>
              )}
            </CorrectAnswerWrapper>
            <QAButtonWrapperMain>
              {!stopRuleScreen &&
                questions.questionsArray[iterate][
                  `correctItem${i18n.t('global-translations.language', {
                    locale: language,
                  })}`
                ] && (
                  <View
                    style={{
                      justifyContent: 'center',
                      marginLeft: 10,
                      marginBottom: 20,
                      flex: 1,
                      width: '70%',
                      marginTop: 20,
                    }}>
                    <QAButtonWrapper
                      onPress={() => revealAnswer(prev => !prev)}
                      activeOpacity={0.2}>
                      <LinearGradient
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        colors={['#00000000', '#00000000']}
                        style={{
                          marginRight: 'auto',
                          width: 'auto',
                          height: revealed
                            ? 'auto'
                            : (height.h45 * magnification) / 2,
                          borderRadius: 50,
                          paddingHorizontal: 10 * magnification,
                          borderColor: revealed ? color.yellow : '#A5A5A5',
                          borderWidth: 1,
                          flexDirection: revealed ? 'row' : 'column',
                          justifyContent: revealed ? 'flex-start' : 'center',
                        }}>
                        {revealed ? (
                          <QAButtonText
                            style={{
                              color: '#A5A5A5',
                              fontSize: (fontSize.f24 * magnification) / 2,
                              textAlign: revealed ? 'left' : 'center',
                              textAlignVertical: 'center',
                              flex: 1,
                              padding: revealed ? 10 : 0,
                            }}>
                            {i18n.t('test-screen.correct-answer', {
                              locale: language,
                            })}
                            {`: `}
                            <Text
                              style={{
                                color: 'black',
                                fontSize: (fontSize.f24 * magnification) / 2,
                              }}>
                              {questions.questionsArray[iterate][
                                `correctItem${i18n.t(
                                  'global-translations.language',
                                  {
                                    locale: language,
                                  },
                                )}`
                              ]
                                .split('/*/')
                                .map((element: string) => {
                                  if (/U\('[^']*'\)/i.test(element)) {
                                    return U(
                                      element
                                        .replace("U('", '')
                                        .replace("')", ''),
                                    );
                                  }
                                  return element;
                                })}
                            </Text>
                          </QAButtonText>
                        ) : (
                          <QAButtonText
                            style={{
                              color: '#A5A5A5',
                              fontSize: (fontSize.f24 * magnification) / 2,
                              textAlign: revealed ? 'left' : 'center',
                              flex: 0.8,
                              textAlignVertical: 'center',
                            }}>
                            {i18n.t('test-screen.reveal-answer', {
                              locale: language,
                            })}
                          </QAButtonText>
                        )}
                      </LinearGradient>
                    </QAButtonWrapper>
                  </View>
                )}
              <LinearGradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                colors={[color.secondary, color.primary]}
                style={[
                  styleSheet.LinearGradient,
                  {
                    width: 'auto',
                    paddingHorizontal: width.w25 * magnification,
                    height: (height.h45 * magnification) / 2,
                    marginTop: 20,
                  },
                ]}>
                <QAButtonWrapper
                  onPress={() => {
                    if (stopRuleScreen) {
                      setStopRuleScreen(false);
                      scrollRef.current.scrollTo({
                        y: 0,
                        animated: true,
                      });
                    } else if (statesObject.answer === null)
                      showMessage({
                        message: 'Answer Mandatory',
                        type: WARNING,
                      });
                    else {
                      if (iterate < questions.questionsArray.length - 1) {
                        showInstruction(false);
                        setStopRuleScreen(true);
                        setIteration(prev => {
                          let iterator = prev;
                          iterator += 1;
                          return iterator;
                        });
                        setStateObject(prev => ({
                          ...prev,
                          nextQuestion: false,
                        }));
                      } else {
                        setStateObject(prev => ({
                          ...prev,
                          nextQuestion: false,
                          backScreenModal: true,
                        }));
                      }
                      registerAnswer(statesObject.answer);
                      scrollRef.current.scrollTo({
                        y: 0,
                        animated: true,
                      });
                    }
                  }}
                  activeOpacity={0.2}>
                  <QAButtonText
                    style={{
                      fontSize: (fontSize.f24 * magnification) / 2,
                    }}>
                    {stopRuleScreen
                      ? i18n.t('test-screen.button-text', {
                          locale: language,
                        })
                      : iterate < questions.questionsArray.length - 1
                      ? i18n.t('test-screen.button-text-next', {
                          locale: language,
                        })
                      : i18n.t('test-screen.button-text-done', {
                          locale: language,
                        })}
                  </QAButtonText>
                </QAButtonWrapper>
              </LinearGradient>
            </QAButtonWrapperMain>
            {stopRuleScreen ? (
              <StopRuleWrapper
                style={{
                  padding: 5 * magnification,
                }}>
                <TimerIcon />
                <Text
                  style={{
                    fontSize: fontSize.f14 * magnification,
                    fontFamily: fontFamily.JosefinSansMeduim,
                    color: '#707070',
                    textAlign: 'center',
                  }}>
                  {i18n.t('test-screen.stop-rule', {
                    locale: language,
                  })}
                  :{' '}
                </Text>
                <Text
                  style={{
                    fontSize: fontSize.f16 * magnification,
                    fontFamily: fontFamily.JosefinSansMeduim,
                    color: '#000000',
                    textAlign: 'center',
                  }}>
                  {i18n
                    .t('test-screen.stop-rule-text', {
                      locale: language,
                    })
                    .replace('[#]', questions.questionsArray[iterate].stopRule)}
                </Text>
              </StopRuleWrapper>
            ) : (
              <View>
                <TimerClock
                  stop={stop}
                  timerDuration={parseInt(
                    questions.questionsArray[iterate].stopRule,
                    10,
                  )}
                  getTime={timeString => setTime(timeString)}
                />
              </View>
            )}
            <AIModal isVisible={statesObject.nextQuestion} modalTitle="">
              <ScrollView>
                <ModalBody>
                  <ConfirmText>
                    {i18n.t('test-screen.confirm-submission', {
                      locale: language,
                    })}
                  </ConfirmText>
                  <LogoutBtnsWrapper>
                    <LinearGradient
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      colors={[color.red.dark, color.red.light]}
                      style={styleSheet.LinearGradient}>
                      <AIButton
                        text={i18n.t('global-translations.no', {
                          locale: language,
                        })}
                        onPress={() =>
                          setStateObject(prev => ({
                            ...prev,
                            nextQuestion: false,
                          }))
                        }
                      />
                    </LinearGradient>
                    <LinearGradient
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      colors={[color.secondary, color.primary]}
                      style={styleSheet.LinearGradient}>
                      <AIButton
                        text={i18n.t('global-translations.yes', {
                          locale: language,
                        })}
                        onPress={() => {
                          if (iterate < questions.questionsArray.length - 1) {
                            setStopRuleScreen(true);
                            setIteration(prev => {
                              let iterator = prev;
                              iterator += 1;
                              return iterator;
                            });
                            setStateObject(prev => ({
                              ...prev,
                              nextQuestion: false,
                            }));
                          } else {
                            setStateObject(prev => ({
                              ...prev,
                              nextQuestion: false,
                              backScreenModal: true,
                            }));
                          }
                          registerAnswer(statesObject.answer);
                          scrollRef.current.scrollTo({
                            y: 0,
                            animated: true,
                          });
                        }}
                      />
                    </LinearGradient>
                  </LogoutBtnsWrapper>
                </ModalBody>
              </ScrollView>
            </AIModal>
            <AIModal
              isVisible={statesObject.backScreenModal}
              modalTitle={i18n.t('global-translations.thankyou', {
                locale: language,
              })}
              logoutModal>
              <ScrollView>
                <ModalBody>
                  <ConfirmText>
                    {i18n.t('test-screen.exit-message', {
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
                        text={i18n.t('global-translations.okay', {
                          locale: language,
                        })}
                        onPress={() => {
                          updateTestResults(responseArray, gender);
                          navigateTo(INCOMPLETE_TEST);
                          if (netInfo.isConnected)
                            startForegroundService(token);
                          setStateObject(prev => ({
                            ...prev,
                            backScreenModal: false,
                          }));
                        }}
                      />
                    </LinearGradient>
                  </LogoutBtnsWrapper>
                </ModalBody>
              </ScrollView>
            </AIModal>
          </>
        )}
      </QABackgroundImage>
    </>
  );
};
export default QuestionAndAnswer;
