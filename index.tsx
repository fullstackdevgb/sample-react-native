import React, { useState } from 'react';
import { fontSize } from '@heroiq/theme/fonts';
import dayjs from 'dayjs';
import { Platform, ScrollView } from 'react-native';
import { ReduxState } from '@heroiq/redux/interface';
import { useSelector, useDispatch } from 'react-redux';
import MeasurementTypePicker from '@heroiq/components/MeasurementTypePicker';
import navigateTo from '@heroiq/navigation/navigate';
import { postUserObservation } from '@heroiq/containers/CarePlanDashboard/actions';
import ButtonWrapper from '../ButtonWrapper';
import InputBox from '../InputBox';
import TimePicker from '../TimePicker';
import Title from '../Title';
import {
  SectionKeyboardAvoidingView,
  SectionWrapper,
  ButtonSection,
} from './styled';

const AddReadingsSection = () => {
  const dispatch = useDispatch();
  const userMeasuremenntType = useSelector(
    (state: ReduxState) => state.deviceStore.measurementType,
  );
  const [systolic, setSystolic] = useState<string>('0');
  const [diastolic, setDiastolic] = useState<string>('0');
  const [measurmentValue, setValue] = useState<string>('0');
  const [secondaryMeasurement, setSecondary] = useState<string | null>(null);
  const [unit, setUnit] = useState<string>('');
  const [date, setDate] = useState(dayjs(new Date()).format('MMMM DD, YYYY'));
  const [dateValue, setDateValue] = useState(null);
  const [time, setTime] = useState(dayjs(new Date()).format('hh:mm A'));
  const [timeValue, setTimeValue] = useState(null);

  const onChange = (event: any, selectedDate: any, title: string) => {
    if (title === 'Time') {
      const currentDate = selectedDate || new Date();
      setTimeValue(currentDate);
      setTime(dayjs(selectedDate).format('hh:mm A'));
    } else if (title === 'Date') {
      const currentDate = selectedDate || new Date();
      setDateValue(currentDate);
      setDate(dayjs(selectedDate).format('MMMM DD, YYYY'));
    }
  };
  React.useEffect(() => {
    switch (userMeasuremenntType) {
      case 'Weight':
        setUnit('KG');
        break;
      case 'Blood Pressure':
        setUnit('mmHG');
        break;
      case 'Heart Rate':
        setUnit('BPM');
        break;
      case 'Blood Oxygen':
        setUnit('SpO2');
        break;
      case 'Blood Sugar':
        setUnit('mmol/L');
        break;
      default:
        break;
    }
  }, [userMeasuremenntType]);

  const displayInput = () => {
    switch (userMeasuremenntType) {
      case 'Weight':
        return <InputBox title="Weight Kg" changeTextVal={setValue} />;
      case 'Blood Pressure':
        return (
          <>
            <InputBox title="Systolic" changeTextVal={setSystolic} />
            <InputBox title="Diastolic" changeTextVal={setDiastolic} />
            <InputBox title="BPM" changeTextVal={setSecondary} />
          </>
        );
      case 'Heart Rate':
        return <InputBox title="BPM" changeTextVal={setValue} />;
      case 'Blood Oxygen':
        return <InputBox title="SpO2" changeTextVal={setValue} />;
      case 'Blood Sugar':
        return <InputBox title="mmol/L" changeTextVal={setValue} />;
      default:
        break;
    }
    return {};
  };

  const onsubmitAction = () => {
    const data: any = {
      measurementType: userMeasuremenntType,
      recordDateTime: new Date(`${date} ${time}`),
      upperLimit: systolic !== '0' ? parseInt(systolic, 10) : null,
      lowerLimit: diastolic !== '0' ? parseInt(diastolic, 10) : null,
      baselineUnit: unit,
      target: null,
      upperLimitTarget: null,
      lowerLimitTarget: null,
      deviceName: null,
      unit,
      value:
        systolic === '0' && diastolic === '0'
          ? parseInt(measurmentValue, 10)
          : null,
      secondaryValue:
        secondaryMeasurement !== null
          ? parseInt(secondaryMeasurement, 10)
          : null,
    };
    dispatch(postUserObservation(data));
    navigateTo('Vitals');
  };

  return (
    <SectionKeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <SectionWrapper>
          <>
            <MeasurementTypePicker pickerText={userMeasuremenntType || ''} />
            <TimePicker
              title="Date"
              mode="date"
              pickerValue={dateValue}
              pickerText={date}
              onChange={onChange}
            />
            <TimePicker
              title="Time"
              mode="time"
              pickerValue={timeValue}
              pickerText={time}
              onChange={onChange}
            />
            {displayInput()}
            <ButtonSection>
              <ButtonWrapper onPressAction={onsubmitAction}>
                <Title size={fontSize.f18}>Submit my reading</Title>
              </ButtonWrapper>
            </ButtonSection>
          </>
        </SectionWrapper>
      </ScrollView>
    </SectionKeyboardAvoidingView>
  );
};
export default AddReadingsSection;
