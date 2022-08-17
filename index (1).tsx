import React from 'react';
import DayReadings from '@heroiq/components/VitalsList/BloodPressureStats/DayReadings';
import themeColor from '@heroiq/theme/color';
import LoadMore from '@heroiq/components/DayReadings/LoadMore';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { selectedVitalsSelector } from '@heroiq/containers/Vitals/selector';
import { CareObservationModel } from '@heroiq/models';
import Wrapper from './styled';

const BloodPressureStats = () => {
  const bpStats = useSelector(selectedVitalsSelector);
  const handleDay = (date: Date) => {
    const dayOfObservation = dayjs(date);
    if (
      dayjs().get('month') === dayOfObservation.get('month') &&
      dayjs().get('year') === dayOfObservation.get('year')
    )
      switch (
        parseInt(dayjs().format('D'), 10) -
        parseInt(dayOfObservation.format('D'), 10)
      ) {
        case 0:
          return 'Today';
        case 1:
          return 'Yesterday';
        default:
          return dayOfObservation.format('MMMM DD,YYYY');
      }
    return dayOfObservation.format('MMMM DD,YYYY');
  };
  return (
    <Wrapper>
      {bpStats?.map((bp: CareObservationModel, index: number) => {
        if (bp.upperLimit !== null && bp.lowerLimit !== null) {
          return (
            <DayReadings
              details={bp}
              color={index % 2 === 0 ? '#FFFFFF' : themeColor.tileBg}
              day={handleDay(bp.recordDateTime)}
              pressureHigh={bp.upperLimit}
              pressureLow={bp.lowerLimit}
              pulseRate={bp.value === null ? '--' : bp.value}
            />
          );
        }
        return null;
      })}
      {bpStats && bpStats.length > 5 && <LoadMore />}
    </Wrapper>
  );
};

export default BloodPressureStats;
