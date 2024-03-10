"use client";
import React, {useEffect, useState} from "react";
import styles from "/app/checkbox.module.css";

export default function Checkbox({ onChange, checked } : { onChange : any, checked : boolean }) {
    const [isChecked, setIsChecked] = useState(checked);

    useEffect(() => {
        setIsChecked(checked);
    }, [checked]);

    const toggleChecked = () => {
        onChange(!isChecked);
        setIsChecked(!isChecked);
    };

    return (
        <div className={styles.checkBox}>
            <input type="checkbox" className={styles.checkbox} checked={isChecked} onChange={() => {}} onClick={toggleChecked}/>
            <div className={styles.transition} onClick={toggleChecked} style={{top: (isChecked ? "-12px" : "-52px"), left: (isChecked ? "-12px" : "-52px")}}></div>
        </div>
    );
}