import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';

describe('Button', () => {
  it('renders its title and fires onPress', () => {
    const onPress = jest.fn();
    render(<Button title="Save" onPress={onPress} />);
    fireEvent.press(screen.getByText('Save'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('ignores presses while loading', () => {
    const onPress = jest.fn();
    render(<Button title="Save" onPress={onPress} loading />);
    expect(screen.queryByText('Save')).toBeNull(); // replaced by spinner
  });

  it('ignores presses when disabled', () => {
    const onPress = jest.fn();
    render(<Button title="Save" onPress={onPress} disabled />);
    fireEvent.press(screen.getByText('Save'));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('EmptyState', () => {
  it('renders title and hint', () => {
    render(<EmptyState title="Nothing here" hint="Add something" />);
    expect(screen.getByText('Nothing here')).toBeTruthy();
    expect(screen.getByText('Add something')).toBeTruthy();
  });
});
