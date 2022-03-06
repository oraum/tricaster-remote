import React from 'react';
import {render} from '@testing-library/react';
import App from './App';
import {Provider} from "react-redux";
import {createStore} from 'redux'

test('renders learn react link', () => {
    const store = createStore((state = {app: {}}, action) => state)
    const {getByText} = render(<Provider store={store}><App/></Provider>);
    const linkElement = getByText(/Tricaster Remote/i);
    expect(linkElement).toBeInTheDocument();
});
